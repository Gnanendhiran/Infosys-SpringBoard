import { pipeline, env } from '@xenova/transformers';

// Skip local model checks for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

export class EmbeddingService {
    private static instance: EmbeddingService;
    private extractor: any = null;
    private modelName = 'Xenova/all-MiniLM-L6-v2';
    private isLoading = false;

    private cache: Map<string, number[]> = new Map();
    private readonly MAX_CACHE_SIZE = 500;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    public async init() {
        if (this.extractor) return;
        if (this.isLoading) {
            // Wait for initialization if already loading
            while (this.isLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (this.extractor) return;
            }
        }

        this.isLoading = true;
        try {
            this.extractor = await pipeline('feature-extraction', this.modelName, {
                quantized: true,
            });
        } catch (error) {
            console.error('Failed to load embedding model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    public async getEmbedding(text: string): Promise<number[]> {
        // Check cache first
        if (this.cache.has(text)) {
            // Move to end (LRU)
            const embedding = this.cache.get(text)!;
            this.cache.delete(text);
            this.cache.set(text, embedding);
            return embedding;
        }

        if (!this.extractor) {
            await this.init();
        }

        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data) as number[];

        // Add to cache
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(text, embedding);

        return embedding;
    }

    public calculateSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        // Since vectors are normalized, dot product is cosine similarity
        let dotProduct = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        return dotProduct;
    }
}
