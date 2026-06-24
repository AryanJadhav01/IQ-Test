from pydantic import BaseModel
from typing import List, Dict, Optional

class AnswerItem(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    correct_answer: str
    category: str
    difficulty: str

class ScoreRequest(BaseModel):
    student_name: str
    answers: List[AnswerItem]

class ScoreResponse(BaseModel):
    overall_iq: int
    category: str
    percentile: float
    domain_scores: Dict[str, int]  # Logical, Pattern, etc. (0 to 100)
    ai_insights: str
    careers: List[str]
