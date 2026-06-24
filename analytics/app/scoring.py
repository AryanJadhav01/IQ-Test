import math
from typing import List, Dict, Tuple
from .models import AnswerItem, ScoreResponse

# Cognitive categories mapped to readable titles
CATEGORY_TITLES = {
    'logical_reasoning': 'Logical Reasoning',
    'pattern_recognition': 'Pattern Recognition',
    'numerical_intelligence': 'Numerical Intelligence',
    'verbal_reasoning': 'Verbal Reasoning',
    'analytical_thinking': 'Analytical Thinking',
    'problem_solving': 'Problem Solving'
}

CAREER_MAPPING = {
    'logical_reasoning': ['Consulting', 'Data Science', 'Law', 'Research'],
    'pattern_recognition': ['Artificial Intelligence', 'Software Engineering', 'UI/UX Design', 'Product Management'],
    'numerical_intelligence': ['Finance', 'Quantitative Analysis', 'Business Analytics', 'Actuarial Science'],
    'verbal_reasoning': ['Corporate Communications', 'Product Management', 'Marketing Strategy', 'Consulting'],
    'analytical_thinking': ['Business Analytics', 'Data Science', 'Operations Research', 'Financial Engineering'],
    'problem_solving': ['Software Engineering', 'Entrepreneurship', 'Cybersecurity', 'Product Design']
}

def calculate_z_and_percentile(z: float) -> float:
    """Calculates percentile from Z-score using the error function (erf)."""
    return 0.5 * (1 + math.erf(z / math.sqrt(2))) * 100

def get_difficulty_weight(difficulty: str) -> float:
    diff = difficulty.lower()
    if diff == 'easy':
        return 1.0
    elif diff == 'medium':
        return 1.5
    elif diff == 'advanced':
        return 2.0
    return 1.0

def score_assessment(student_name: str, answers: List[AnswerItem]) -> ScoreResponse:
    # 1. Group answers by category and calculate total/earned weights
    category_stats = {}  # key: category -> {total_weight: float, earned_weight: float}
    
    total_max_weight = 0.0
    total_earned_weight = 0.0
    
    for ans in answers:
        cat = ans.category
        if cat not in category_stats:
            category_stats[cat] = {'total_weight': 0.0, 'earned_weight': 0.0}
            
        weight = get_difficulty_weight(ans.difficulty)
        category_stats[cat]['total_weight'] += weight
        total_max_weight += weight
        
        # Check if correct
        is_correct = (ans.selected_option is not None) and (ans.selected_option.strip().upper() == ans.correct_answer.strip().upper())
        if is_correct:
            category_stats[cat]['earned_weight'] += weight
            total_earned_weight += weight

    # Fallback to prevent divide by zero
    if total_max_weight == 0:
        total_max_weight = 1.0

    # 2. Calculate domain scores (0-100)
    domain_scores = {}
    for cat_key, title in CATEGORY_TITLES.items():
        stats = category_stats.get(cat_key, {'total_weight': 1.0, 'earned_weight': 0.0})
        # Score out of 100
        score = int((stats['earned_weight'] / max(stats['total_weight'], 1.0)) * 100)
        domain_scores[title] = max(0, min(100, score))

    # 3. Calculate Overall IQ
    # Ratio of earned points to max points
    ratio = total_earned_weight / total_max_weight
    
    # Map ratio to standardized IQ (Mean = 100, SD = 15) using a piecewise Z-score formula
    # to scale properly from 70 (Min) to 160 (Max) IQ.
    if ratio < 0.50:
        z_score = (ratio - 0.50) / 0.25
    else:
        z_score = (ratio - 0.50) / 0.125
    
    # Cap Z-score between -2.0 and +4.0 (corresponds to IQ 70 to 160)
    z_score = max(-2.0, min(4.0, z_score))
    
    overall_iq = int(100 + (z_score * 15))
    percentile = round(calculate_z_and_percentile(z_score), 1)

    # 4. Classify category
    if overall_iq < 80:
        category_class = 'Borderline'
    elif overall_iq < 90:
        category_class = 'Low Average'
    elif overall_iq < 110:
        category_class = 'Average'
    elif overall_iq < 120:
        category_class = 'Above Average'
    elif overall_iq < 135:
        category_class = 'Highly Intelligent'
    else:
        category_class = 'Exceptional'

    # 5. Sort categories to find Strengths and Weaknesses
    sorted_domains = sorted(domain_scores.items(), key=lambda item: item[1], reverse=True)
    highest_domain, highest_score = sorted_domains[0]
    lowest_domain, lowest_score = sorted_domains[-1]

    # Find category keys for recommendations
    highest_cat_key = next((k for k, v in CATEGORY_TITLES.items() if v == highest_domain), 'logical_reasoning')
    lowest_cat_key = next((k for k, v in CATEGORY_TITLES.items() if v == lowest_domain), 'verbal_reasoning')

    # Get recommended careers based on highest scores
    recommended_careers = list(CAREER_MAPPING.get(highest_cat_key, ['Consulting', 'Software Engineering']))
    # Add a fallback career from the second highest domain
    if len(sorted_domains) > 1:
        second_highest_cat_key = next((k for k, v in CATEGORY_TITLES.items() if v == sorted_domains[1][0]), 'problem_solving')
        extra_careers = CAREER_MAPPING.get(second_highest_cat_key, [])
        for c in extra_careers:
            if c not in recommended_careers:
                recommended_careers.append(c)
                break
    recommended_careers = recommended_careers[:3]  # Top 3 careers

    # 6. Generate AI Insights (300-500 words)
    ai_insights = generate_insights_text(student_name, overall_iq, category_class, domain_scores, highest_domain, lowest_domain)

    return ScoreResponse(
        overall_iq=overall_iq,
        category=category_class,
        percentile=percentile,
        domain_scores=domain_scores,
        ai_insights=ai_insights,
        careers=recommended_careers
    )

def generate_insights_text(name: str, iq: int, cat: str, scores: Dict[str, int], strength: str, weakness: str) -> str:
    # Build detailed paragraphs analyzing the candidate
    p1 = (
        f"Dear {name}, based on your performance on the College Simplified Advanced IQ Assessment, you have achieved "
        f"an overall IQ score of {iq}, placing you in the '{cat}' cognitive category. This score indicates a strong "
        f"command of logical analysis and problem-solving, outperforming a significant portion of the student population. "
        f"Your cognitive blueprint reveals a highly structured approach to parsing complex scenarios, translating raw inputs "
        f"into logical frameworks, and identifying critical dependencies under temporal constraints."
    )

    # Paragraph 2: Strength Analysis
    strength_desc = {
        'Logical Reasoning': "an exceptional capacity for deductive and inductive logic. You excel at isolating core arguments, recognizing logical fallacies, and mapping conditional rules. This is a foundational trait of elite analysts and legal minds.",
        'Pattern Recognition': "a superior ability to synthesize spatial-temporal arrangements and abstract matrix sequences. Your mind excels at identifying underlying order within noisy data and visualizing structures, a key asset in software architecture and machine learning.",
        'Numerical Intelligence': "an outstanding ability to manipulate quantitative values, solve multi-step algebraic formulations, and identify rates of change. Your proficiency in numerical logic suggests high aptitude for financial engineering, economics, and statistical research.",
        'Verbal Reasoning': "high cognitive dexterity in textual comprehension, linguistic analogies, and argument reconstruction. You process semantic nuances rapidly, which translates into powerful executive communication and strategy formation.",
        'Analytical Thinking': "a precise capacity for decomposing multi-faceted problems into discrete components and evaluating data sufficiency. You are naturally equipped to make optimal decisions using incomplete inputs, a hallmark of strategic consulting.",
        'Problem Solving': "high-level algorithmic optimization and spatial problem-solving skills. You naturally formulate creative, work-efficient solutions to bottle-necks rather than repeating brute-force methods. This indicates strong entrepreneurial and engineering potential."
    }
    p2 = (
        f"Your primary cognitive strength is {strength}, where you demonstrated {strength_desc.get(strength, 'high aptitude')}. "
        f"This means that in environments requiring rapid processing of {strength.lower()} assets, you possess a distinct competitive advantage. "
        f"You should rely on this capability when leading teams through complex brainstorming sessions or resolving analytical bottlenecks."
    )

    # Paragraph 3: Weakness & Growth Analysis
    weakness_desc = {
        'Logical Reasoning': "developing formal logic mapping and conditional diagrams to prevent heuristic biases.",
        'Pattern Recognition': "engaging in spatial geometry, logic matrices, and flowcharts to boost visual-spatial reasoning.",
        'Numerical Intelligence': "practicing mental arithmetic estimation and algebraic structures to increase quantitative processing speed.",
        'Verbal Reasoning': "reading dense academic, philosophical, or legal journals to further refine text-reconstruction speed.",
        'Analytical Thinking': "working with logic games, grid puzzles, and decision trees to strengthen systematic sorting methods.",
        'Problem Solving': "studying algorithmic designs and coding logic to train systemic optimization thinking."
    }
    p3 = (
        f"While your profile is well-rounded, your lowest relative score was in {weakness} ({scores.get(weakness)}/100). "
        f"To maximize your cognitive efficiency, we recommend {weakness_desc.get(weakness, 'further practice in this domain')}. "
        f"Slight adjustments in how you approach {weakness.lower()} tasks—such as using written diagrams or breaking down "
        f"instructions into modular micro-steps—will bridge this gap and help you unlock your full intellectual capacity."
    )

    # Paragraph 4: Decision Making and Summary
    # Determine style
    if scores.get('Analytical Thinking', 50) > 70 or scores.get('Logical Reasoning', 50) > 70:
        dec_style = "systematic and evidence-based. You rely heavily on deductive structures and objective data validation before executing."
    else:
        dec_style = "flexible and heuristically agile. You process visual patterns and relational indicators quickly, enabling swift intuitive choices."
        
    p4 = (
        f"In terms of operational and decision-making style, your results indicate that you are {dec_style} "
        f"This cognitive style is highly effective in team environments, acting as a reliable anchor during volatile situations. "
        f"Moving forward, we recommend aligning your career objectives with fields that heavily leverage {strength.lower()}, "
        f"while actively training your {weakness.lower()} to ensure balanced cognitive performance."
    )

    return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"
