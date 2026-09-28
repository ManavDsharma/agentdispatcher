"""Mock categorization-matrix and roster data, used when
CATEGORIZATION_MATRIX_TABLE_NAME / ROSTER_TABLE_NAME aren't configured or a
real DynamoDB call fails — same fallback philosophy as mock_data.py.

Real schemas (for reference — DynamoDB just gives us raw items, we don't
model these as strict types, same lesson learned from over-fitting the
ticket schema once already):

categorization_matrix: issue_id (PK), active, affected_service,
  business_impact, category_description, category_name, created_on, impact,
  issue, issue_description, issue_type, sub_category_description,
  sub_category_name, team_id, updated_by, updated_on, urgency

roster: UID (PK), active, created_on, days_availability, emp_id, employee_id,
  employee_name, level, month, shift, shift_end_time, shift_start_time,
  team_email_id, team_id, team_name, updated_by, updated_on, year
"""

_CATEGORIZATION_MATRIX = [
    {
        "issue_id": "ISS-001",
        "category_name": "Bot Failure",
        "sub_category_name": "Login Timeout",
        "team_id": "RPA-L1",
        "impact": "High",
        "urgency": "High",
        "issue_type": "Incident",
        "affected_service": "AP Invoice Processor",
        "active": True,
    },
    {
        "issue_id": "ISS-002",
        "category_name": "Bot Failure",
        "sub_category_name": "Data Validation",
        "team_id": "RPA-L1",
        "impact": "Medium",
        "urgency": "Medium",
        "issue_type": "Incident",
        "affected_service": "Vendor Reconciliation",
        "active": True,
    },
    {
        "issue_id": "ISS-003",
        "category_name": "Schedule",
        "sub_category_name": "Trigger Failure",
        "team_id": "RPA-L1",
        "impact": "Medium",
        "urgency": "High",
        "issue_type": "Incident",
        "affected_service": "EOD Reporting",
        "active": True,
    },
    {
        "issue_id": "ISS-004",
        "category_name": "Asset",
        "sub_category_name": "Credential Rotation",
        "team_id": "RPA-L1",
        "impact": "Medium",
        "urgency": "Medium",
        "issue_type": "Request",
        "affected_service": "SAP",
        "active": True,
    },
    {
        "issue_id": "ISS-005",
        "category_name": "Asset",
        "sub_category_name": "Hardware",
        "team_id": "IT-Support",
        "impact": "Low",
        "urgency": "Low",
        "issue_type": "Incident",
        "affected_service": "Print Services",
        "active": True,
    },
    {
        "issue_id": "ISS-006",
        "category_name": "Access",
        "sub_category_name": "VPN",
        "team_id": "IT-Access",
        "impact": "Medium",
        "urgency": "Medium",
        "issue_type": "Request",
        "affected_service": "VPN Gateway",
        "active": True,
    },
    {
        "issue_id": "ISS-007",
        "category_name": "Access",
        "sub_category_name": "Offboarding",
        "team_id": "IT-Access",
        "impact": "Low",
        "urgency": "Low",
        "issue_type": "Request",
        "affected_service": "Identity Platform",
        "active": True,
    },
    {
        "issue_id": "ISS-008",
        "category_name": "Deployment",
        "sub_category_name": "Rollback",
        "team_id": "RPA-L1",
        "impact": "High",
        "urgency": "Medium",
        "issue_type": "Change",
        "affected_service": "Invoice Bot v2",
        "active": True,
    },
    {
        "issue_id": "ISS-009",
        "category_name": "Performance",
        "sub_category_name": "Queue Delay",
        "team_id": "RPA-L1",
        "impact": "Medium",
        "urgency": "Low",
        "issue_type": "Incident",
        "affected_service": "Orchestrator Queue",
        "active": True,
    },
    {
        "issue_id": "ISS-010",
        "category_name": "Role Management",
        "sub_category_name": "Technical Roles",
        "team_id": "IAM Governance",
        "impact": "Medium",
        "urgency": "Medium",
        "issue_type": "Request",
        "affected_service": "IAM Platform",
        "active": True,
    },
]

_ROSTER = [
    {"UID": "EMP-001", "employee_id": "E1001", "emp_id": "E1001", "employee_name": "L. Kumar", "team_id": "RPA-L1", "team_name": "RPA L1 Support", "level": "L1", "active": True},
    {"UID": "EMP-002", "employee_id": "E1002", "emp_id": "E1002", "employee_name": "R. Singh", "team_id": "RPA-L1", "team_name": "RPA L1 Support", "level": "L1", "active": True},
    {"UID": "EMP-003", "employee_id": "E1003", "emp_id": "E1003", "employee_name": "P. Verma", "team_id": "RPA-L1", "team_name": "RPA L1 Support", "level": "L2", "active": True},
    {"UID": "EMP-004", "employee_id": "E1004", "emp_id": "E1004", "employee_name": "R. Singh", "team_id": "IT-Access", "team_name": "IT Access Management", "level": "L1", "active": True},
    {"UID": "EMP-005", "employee_id": "E1005", "emp_id": "E1005", "employee_name": "S. Rao", "team_id": "IT-Access", "team_name": "IT Access Management", "level": "L1", "active": True},
    {"UID": "EMP-006", "employee_id": "E1006", "emp_id": "E1006", "employee_name": "R. Singh", "team_id": "IT-Support", "team_name": "IT Support", "level": "L1", "active": True},
    {"UID": "EMP-007", "employee_id": "E1007", "emp_id": "E1007", "employee_name": "A. Mehta", "team_id": "IAM Governance", "team_name": "IAM Governance", "level": "L2", "active": True},
    {"UID": "EMP-008", "employee_id": "E1008", "emp_id": "E1008", "employee_name": "K. Nair", "team_id": "IAM Governance", "team_name": "IAM Governance", "level": "L1", "active": True},
]


def get_mock_categorization_matrix() -> list:
    return [dict(row) for row in _CATEGORIZATION_MATRIX]


def get_mock_roster() -> list:
    return [dict(row) for row in _ROSTER]
