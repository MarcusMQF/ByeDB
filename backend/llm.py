import os
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import json

load_dotenv()

class SQLExpertLLM:
    def __init__(self):
        self.token = os.environ["GITHUB_TOKEN"]
        self.endpoint = "https://models.github.ai/inference"
        self.model = "openai/gpt-4.1"
        
        self.client = OpenAI(
            base_url=self.endpoint,
            api_key=self.token,
        )
    
    def get_sql_expert_prompt(self, intent_data: Dict[str, Any]) -> str:
        """Generate context-aware prompt based on user intent"""
        
        base_prompt = """You are an expert SQL database architect and developer with 15+ years of experience. Your are assistant by ByeBD."""
        
        if intent_data.get("intent") == "tutorial":
            return f"""{base_prompt}

The user wants to LEARN SQL concepts. Focus on:
- Clear, educational explanations
- Step-by-step breakdowns
- Fundamental concepts
- Learning-oriented examples
- Why things work the way they do

Format: Start with concept explanation, then show practical examples."""
            
        elif intent_data.get("intent") == "code_generation":
            return f"""{base_prompt}

The user needs WORKING SQL CODE for their specific use case. Focus on:
- Production-ready SQL code
- Immediate practical solution
- Clear code comments
- Security considerations
- Performance optimization

Format: Brief explanation, then complete working code with examples."""
            
        elif intent_data.get("intent") == "troubleshooting":
            return f"""{base_prompt}

The user has a PROBLEM with existing SQL. Focus on:
- Identifying the issue
- Providing the fix
- Explaining why it wasn't working
- Prevention tips

Format: Problem analysis, solution, and prevention advice."""
            
        elif intent_data.get("intent") == "optimization":
            return f"""{base_prompt}

The user wants to IMPROVE SQL performance. Focus on:
- Performance analysis
- Optimization techniques
- Index recommendations
- Query restructuring
- Execution plan insights

Format: Performance analysis, optimization strategies, and improved code."""
            
        elif intent_data.get("intent") == "design":
            return f"""{base_prompt}

The user needs DATABASE DESIGN help. Focus on:
- Schema design principles
- Table relationships
- Normalization
- Constraints and indexes
- Scalability considerations

Format: Design principles, schema code, and implementation guidance."""
            
        else:
            # Default comprehensive prompt
            return f"""{base_prompt}

Provide a comprehensive response with:
- Clear explanation
- Working SQL code (if applicable)
- Best practices
- Practical examples

Be thorough and production-ready."""

    def generate_sql_response(self, user_question: str, context: Optional[str] = None) -> Dict[str, Any]:
        """Generate SQL code and expert explanation for user questions"""
        
        # First, analyze the intent silently
        intent_result = self.analyze_query_intent(user_question)
        intent_data = intent_result.get("intent", {}) if intent_result["success"] else {}
        
        # Generate context-aware prompt
        system_prompt = self.get_sql_expert_prompt(intent_data)
        
        # Add context if provided
        if context:
            user_message = f"Context: {context}\n\nQuestion: {user_question}"
        else:
            user_message = user_question
        
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,  # Lower temperature for more consistent technical responses
                top_p=0.9,
                model=self.model,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            return {
                "success": True,
                "response": content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response": None
            }
    
    def analyze_query_intent(self, user_question: str) -> Dict[str, Any]:
        """Analyze what type of SQL help the user needs"""
        
        intent_prompt = """Analyze the user's SQL question and classify their intent. Return JSON format:
{
    "intent": "tutorial|code_generation|troubleshooting|optimization|design",
    "response_type": "educational|practical|diagnostic|advisory",
    "has_specific_table": true/false,
    "requires_sql_code": true/false,
    "complexity": "beginner|intermediate|advanced",
    "focus": "concept_explanation|working_code|best_practices|problem_solving"
}

Intent definitions:
- tutorial: User wants to learn/understand SQL concepts
- code_generation: User needs actual SQL code for their specific use case
- troubleshooting: User has a problem with existing SQL
- optimization: User wants to improve performance
- design: User needs database schema design help"""
        
        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": intent_prompt},
                    {"role": "user", "content": user_question}
                ],
                temperature=0.1,
                model=self.model,
                max_tokens=200
            )
            
            content = response.choices[0].message.content
            # Try to parse as JSON
            if content:
                try:
                    intent_data = json.loads(content)
                    return {"success": True, "intent": intent_data}
                except json.JSONDecodeError:
                    return {"success": False, "error": "Could not parse intent", "raw_response": content}
            else:
                return {"success": False, "error": "No content received"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

def test_sql_expert():
    """Test function for terminal testing"""
    llm = SQLExpertLLM()
    
    print("=== SQL Expert LLM Test ===\n")
    
    # Test questions
    test_questions = [
        "How to use SQL to store user authentication?",
        "Create a secure login system with SQL",
        "How to optimize SQL queries for better performance?",
        "Design a database schema for an e-commerce system"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"Test {i}: {question}")
        print("-" * 50)
        
        # Generate response (intent analysis happens internally)
        result = llm.generate_sql_response(question)
        
        if result["success"]:
            print(result["response"])
        else:
            print(f"Error: {result['error']}")
        
        print("\n" + "="*80 + "\n")

def interactive_sql_expert():
    """Interactive mode for testing"""
    llm = SQLExpertLLM()
    
    print("=== Interactive SQL Expert ===")
    print("Ask any SQL-related question. Type 'quit' to exit.\n")
    
    while True:
        question = input("Your question: ").strip()
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("Goodbye!")
            break
        
        if not question:
            continue
        
        print("\nProcessing your question...")
        
        # Generate response (intent analysis happens internally)
        result = llm.generate_sql_response(question)
        
        if result["success"]:
            print(result["response"])
        else:
            print(f"Error: {result['error']}")
        
        print("\n" + "-"*60 + "\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            test_sql_expert()
        elif sys.argv[1] == "interactive":
            interactive_sql_expert()
        elif sys.argv[1] == "quick":
            # Quick test with a single question
            llm = SQLExpertLLM()
            question = "How to use SQL to store user authentication?"
            result = llm.generate_sql_response(question)
            if result["success"]:
                print(result["response"])
            else:
                print(f"Error: {result['error']}")
        else:
            print("Usage: python llm.py [test|interactive|quick]")
    else:
        # Default: run interactive mode
        interactive_sql_expert()

