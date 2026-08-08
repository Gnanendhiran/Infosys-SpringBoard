import Header from "@/components/Layout/Header";
import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import UserTypes from "@/components/Home/UserTypes";

const Home = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <div className="relative z-10">

        <Hero />
        <Features />
        <UserTypes />
      </div>
    </div>
  );
};

export default Home;
