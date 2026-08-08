import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeId, resumeText, jobDescription } = await req.json();

    if (!resumeId || !resumeText) {
      throw new Error("Missing required fields: resumeId and resumeText");
    }

    console.log("Analyzing resume:", resumeId);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume analyzer. Analyze the provided resume and extract:
1. Skills (technical and soft skills as array)
2. Years of experience (numeric)
3. Education level (high_school, bachelors, masters, phd)
4. Job titles held (array)
5. Skill gaps for modern job market (array of objects with skill name and importance)
6. Learning recommendations (array of objects with course name, platform, and url)
7. Project suggestions to strengthen resume (array of objects with title, description, skills)
8. ATS score (0-100 based on formatting, keywords, structure)
9. Predicted suitable roles (array of job titles)
10. Job match score (0-100) comparing the resume against the provided job description, based on skills overlap, seniority fit, responsibilities alignment, and domain relevance
11. Matching skills (array of strings) - skills present in both JD and Resume
12. Missing skills (array of strings) - skills required in JD but not present in Resume
13. Extra skills (array of strings) - skills present in Resume but not in JD

Return ONLY valid JSON with these exact keys: extracted_skills, experience_years, education_level, job_titles, skill_gaps, learning_recommendations, project_suggestions, ats_score, predicted_roles, job_match_score, matching_skills, missing_skills, extra_skills. No markdown, no explanation.`;

    const userPrompt = `Analyze this resume against the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription || "No specific job description provided"}`;

    // Call Google Gemini API to analyze the resume
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your Gemini API configuration." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();

    // Extract text from Gemini response format
    let analysisText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log("AI Analysis complete");

    // Parse the AI response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);

      // Normalize skill_gaps field names (AI might return "skill" instead of "skill_name")
      if (analysis.skill_gaps && Array.isArray(analysis.skill_gaps)) {
        analysis.skill_gaps = analysis.skill_gaps.map((gap: any) => ({
          skill: gap.skill || gap.skill_name,
          importance: gap.importance
        }));
      }

      // Normalize learning_recommendations field names
      if (analysis.learning_recommendations && Array.isArray(analysis.learning_recommendations)) {
        analysis.learning_recommendations = analysis.learning_recommendations.map((rec: any) => ({
          course: rec.course || rec.course_name,
          platform: rec.platform,
          url: rec.url
        }));
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("Invalid AI response format");
    }

    // Use JD-aware match score if provided, otherwise fall back to heuristic
    const matchScore = Math.min(100, Math.round(
      typeof analysis.job_match_score === "number"
        ? analysis.job_match_score
        : ((analysis.ats_score * 0.4) + (analysis.extracted_skills?.length * 2) + (analysis.experience_years * 3))
    ));

    // Save analysis to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("resume_analysis")
      .insert({
        resume_id: resumeId,
        extracted_skills: analysis.extracted_skills,
        experience_years: analysis.experience_years,
        education_level: analysis.education_level,
        job_titles: analysis.job_titles,
        match_score: matchScore,
        skill_gaps: analysis.skill_gaps,
        learning_recommendations: analysis.learning_recommendations,
        project_suggestions: analysis.project_suggestions,
        ats_score: analysis.ats_score,
        predicted_roles: analysis.predicted_roles,
        matching_skills: analysis.matching_skills || [],
        missing_skills: analysis.missing_skills || [],
        extra_skills: analysis.extra_skills || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to save analysis");
    }

    // Update resume status
    await supabase
      .from("resumes")
      .update({ status: "completed" })
      .eq("id", resumeId);

    console.log("Analysis saved successfully");

    return new Response(
      JSON.stringify({ success: true, analysis: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
