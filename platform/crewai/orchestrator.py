"""
CrewAI Multi-Crew Orchestrator
Routes requests to appropriate specialized crews based on module/intent
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from langchain_groq import ChatGroq
from pydantic import SecretStr

from crews.competitor_intelligence import CompetitorIntelligenceCrew
from crews.content_automation import ContentAutomationCrew
from crews.lead_intelligence import LeadIntelligenceCrew
from crews.social_campaign import SocialCampaignCrew
from crews.video_generation import VideoGenerationCrew
from crews.company_intelligence import CompanyIntelligenceCrew
from crews.customer_view import CustomerViewCrew
from crews.budget_optimization import BudgetOptimizationCrew
from crews.performance_scorecard import PerformanceScorecardCrew

logger = logging.getLogger(__name__)


class CrewOrchestrator:
    """
    Multi-Crew Orchestrator

    Routes user requests to the appropriate specialized crew:
    - Competitor Intelligence: Competitor analysis, monitoring, battlecards
    - Content Automation: SEO research, blog posts, multi-platform publishing
    - Lead Intelligence: Lead scoring, enrichment, ICP matching, segmentation
    - Social Media Campaign: Campaign planning, video production, social publishing
    - Video Generation: Veo 3.1, HeyGen avatars, Shotstack editing
    - Company Intelligence: Firmographics, tech stack, org charts, contacts
    - Unified Customer View: 360° profiles, journey mapping, CLV prediction
    - Budget Optimization: ROI analysis, spend allocation, forecasting
    - Performance Scorecard: Real-time metrics, anomaly detection, dashboards
    """

    def __init__(self, groq_api_key: Optional[str] = None):
        """
        Initialize orchestrator with all crews

        Args:
            groq_api_key: Groq API key for LLM-based routing
        """
        self.groq_api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY must be provided or set in environment")

        # Initialize routing LLM
        self.routing_llm = ChatGroq(
            api_key=SecretStr(self.groq_api_key),
            model="llama-3.3-70b-versatile",
            temperature=0.1,  # Low temperature for consistent routing
            max_tokens=500
        )

        # Initialize crews
        self.crews = self._initialize_crews()

        logger.info(f"✅ Orchestrator initialized with {len(self.crews)} crews")

    def _initialize_crews(self) -> Dict[str, Any]:
        """Initialize all available crews"""
        crews = {}

        crew_classes = {
            "competitor": CompetitorIntelligenceCrew,
            "content": ContentAutomationCrew,
            "lead": LeadIntelligenceCrew,
            "social": SocialCampaignCrew,
            "video": VideoGenerationCrew,
            "company": CompanyIntelligenceCrew,
            "customer": CustomerViewCrew,
            "budget": BudgetOptimizationCrew,
            "scorecard": PerformanceScorecardCrew
        }

        for crew_name, crew_class in crew_classes.items():
            try:
                crews[crew_name] = crew_class(groq_api_key=self.groq_api_key)
                logger.info(f"✅ {crew_name.capitalize()} Crew initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize {crew_name} crew: {e}")

        return crews

    def route_request(
        self,
        user_request: str,
        module: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Route request to appropriate crew

        Args:
            user_request: Natural language request from user
            module: Explicit module name (competitor, content, lead, etc.)
                   If None, auto-detect from user_request
            **kwargs: Additional parameters passed to crew

        Returns:
            Workflow execution result
        """
        # Use explicit module or auto-detect
        if module:
            detected_module = module
            logger.info(f"📍 Explicit module routing: {detected_module}")
        else:
            detected_module = self._detect_module(user_request)
            logger.info(f"🔍 Auto-detected module: {detected_module}")

        # Validate module exists
        if detected_module not in self.crews:
            available = ", ".join(self.crews.keys())
            raise ValueError(
                f"Module '{detected_module}' not available. "
                f"Available modules: {available}"
            )

        # Execute workflow with appropriate crew
        logger.info(f"🚀 Executing {detected_module} crew workflow")
        crew = self.crews[detected_module]

        try:
            result = crew.execute_workflow(
                user_request=user_request,
                **kwargs
            )

            return {
                "module": detected_module,
                "status": "completed",
                "result": result,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ Crew execution failed: {e}", exc_info=True)
            return {
                "module": detected_module,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _detect_module(self, user_request: str) -> str:
        """
        Use LLM to detect which module should handle the request

        Args:
            user_request: Natural language request

        Returns:
            Module name (competitor, content, lead, etc.)
        """
        detection_prompt = f"""Analyze this user request and determine which module should handle it.

Available modules:
- competitor: Competitor intelligence, analysis, monitoring, battlecards
- content: Content creation, SEO research, blog posts, articles
- lead: Lead scoring, enrichment, ICP matching, segmentation
- social: Social media campaigns, video production, multi-platform publishing
- video: Video generation, Veo 3.1, HeyGen avatars, video editing
- company: Company intelligence, firmographics, tech stack analysis
- customer: Customer 360 view, journey mapping, CLV prediction
- budget: Marketing budget optimization, ROI analysis, spend allocation
- scorecard: Performance metrics, KPI tracking, dashboard creation

User request: "{user_request}"

Respond with ONLY the module name (one word, lowercase).
"""

        try:
            response = self.routing_llm.invoke(detection_prompt)

            # Handle response content (can be string or list)
            if isinstance(response.content, str):
                module = response.content.strip().lower()
            elif isinstance(response.content, list) and len(response.content) > 0:
                # Take first element if list
                module = str(response.content[0]).strip().lower()
            else:
                module = str(response.content).strip().lower()

            # Validate response
            if module in self.crews:
                return module
            else:
                # Default to competitor if detection fails
                logger.warning(
                    f"Invalid module detected: '{module}'. Defaulting to 'competitor'"
                )
                return "competitor"

        except Exception as e:
            logger.error(f"Module detection failed: {e}. Defaulting to 'competitor'")
            return "competitor"

    def execute_multi_crew_workflow(
        self,
        requests: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Execute multiple crew workflows in parallel

        Args:
            requests: List of workflow requests, each with:
                - user_request: str
                - module: str (optional)
                - Additional crew-specific parameters

        Returns:
            List of workflow results
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed

        results = []

        with ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all requests
            futures = {
                executor.submit(
                    self.route_request,
                    request.get("user_request", ""),
                    request.get("module"),
                    **{k: v for k, v in request.items() if k not in ["user_request", "module"]}
                ): request
                for request in requests
            }

            # Collect results as they complete
            for future in as_completed(futures):
                request = futures[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Parallel workflow failed: {e}")
                    results.append({
                        "module": request.get("module", "unknown"),
                        "status": "failed",
                        "error": str(e)
                    })

        return results

    def execute_for_scheduler(
        self,
        crew_module: str,
        task_type: str,
        system_context: str,
        prior_memory: str,
        client_context: str = ""
    ) -> dict:
        """
        Entry point for the autonomous scheduler.
        Wraps route_request() with SOUL.md + MEMORY.md context injection.

        Returns a dict matching the agent_notifications schema:
        {
            "title": str,
            "summary": str,
            "full_output": dict,
            "action_items": list,
            "role": str
        }
        """
        combined_context = f"{system_context}\n\n## Prior Memory\n{prior_memory}"
        if client_context:
            combined_context += f"\n\n## Client Context\n{client_context}"

        user_request = f"{combined_context}\n\nTask: {task_type}"

        try:
            result = self.route_request(
                user_request=user_request,
                module=crew_module
            )
            # Normalise to agent_notifications schema
            raw = result.get("result", result)
            if isinstance(raw, str):
                return {
                    "title": f"{task_type.replace('_', ' ').title()} completed",
                    "summary": raw[:500],
                    "full_output": {"output": raw},
                    "action_items": [],
                    "role": ""
                }
            return {
                "title": raw.get("title", f"{task_type.replace('_', ' ').title()} completed"),
                "summary": raw.get("summary", str(raw)[:500]),
                "full_output": raw if isinstance(raw, dict) else {"output": str(raw)},
                "action_items": raw.get("action_items", []),
                "role": raw.get("role", "")
            }
        except Exception as e:
            return {
                "title": f"{task_type.replace('_', ' ').title()} failed",
                "summary": f"Agent encountered an error: {str(e)[:200]}",
                "full_output": {"error": str(e)},
                "action_items": [],
                "role": ""
            }

    def get_available_modules(self) -> Dict[str, Dict[str, Any]]:
        """Get information about all available modules/crews"""
        modules = {}

        for module_name, crew in self.crews.items():
            try:
                # Get agent info if crew has this method
                if hasattr(crew, 'get_agent_info'):
                    agent_info = crew.get_agent_info()
                else:
                    agent_info = []

                modules[module_name] = {
                    "name": module_name,
                    "status": "available",
                    "agents": agent_info
                }
            except Exception as e:
                logger.error(f"Failed to get info for {module_name}: {e}")
                modules[module_name] = {
                    "name": module_name,
                    "status": "error",
                    "error": str(e)
                }

        return modules
