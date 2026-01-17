import chromadb
from chromadb.utils import embedding_functions
import uuid

class MemoryService:
    def __init__(self, persist_directory="./chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        # Using default embedding function (sentence-transformers)
        self.collection = self.client.get_or_create_collection(
            name="chat_memory",
            metadata={"hnsw:space": "cosine"}
        )

    async def add_interaction(self, session_id: str, user_text: str, assistant_text: str):
        """Store a user-assistant interaction in vector memory."""
        doc_id = str(uuid.uuid4())
        text = f"User: {user_text}\nAssistant: {assistant_text}"
        self.collection.add(
            documents=[text],
            metadatas=[{"session_id": session_id}],
            ids=[doc_id]
        )

    async def get_relevant_context(self, query: str, session_id: str = None, n_results: int = 3):
        """Retrieve relevant past interactions for context."""
        where = {"session_id": session_id} if session_id else None
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where
        )
        
        if results['documents'] and results['documents'][0]:
            return "\n---\n".join(results['documents'][0])
        return ""

memory_service = MemoryService()
