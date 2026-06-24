from fastapi import FastAPI, HTTPException
from .models import ScoreRequest, ScoreResponse
from .scoring import score_assessment

app = FastAPI(
    title="College Simplified IQ Analytics Service",
    description="Calculates normalized IQ scores and domain breakdown details",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analytics"}

@app.post("/score", response_model=ScoreResponse)
def get_score(payload: ScoreRequest):
    try:
        if not payload.answers:
            raise HTTPException(status_code=400, detail="Answer list cannot be empty")
        
        response = score_assessment(payload.student_name, payload.answers)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
