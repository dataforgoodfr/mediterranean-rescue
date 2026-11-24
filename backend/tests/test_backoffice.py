from pathlib import Path

from fastapi.testclient import TestClient
from sqlmodel import Session

from scripts.load_fictive_data import load_fictive_data

FIXTURE = Path(__file__).parents[1] / "fixtures" / "3_fictive_data.csv"


def test_the_api_lists_all_fictive_operations(client: TestClient, session: Session) -> None:
    load_fictive_data(session, FIXTURE)

    operations = client.get("/api/backoffice/operations").json()

    # De la plus ancienne à la plus récente.
    assert [operation["date"] for operation in operations] == [
        "2017-08-12",
        "2021-01-26",
        "2023-02-17",
    ]
    assert [operation["state"] for operation in operations] == [
        "published",
        "to_verify",
        "published",
    ]
    latest = operations[1]
    assert latest["missing_fields"] == [
        "male",
        "female",
        "under_18",
        "under_18_unacc",
        "under_5",
        "pregnant_women",
        "wind_force",
        "wave_height",
        "transfer_type",
        "video_src",
        "testimony_name",
    ]


def test_the_api_lists_filtered_fictive_operations(client: TestClient, session: Session) -> None:
    load_fictive_data(session, FIXTURE)

    operations = client.get("/api/backoffice/operations?state=to_verify").json()

    assert all(operation["state"] == "to_verify" for operation in operations)
    assert len(operations) == 1
    latest = operations[0]
    assert latest["date"] == "2021-01-26"


def test_the_operations_routes_are_documented(client: TestClient) -> None:
    assert "/api/backoffice/operations" in client.get("/api/openapi.json").json()["paths"]


def test_invalid_state_filters_returns_422(client: TestClient) -> None:
    response = client.get("/api/backoffice/operations?state=invalid_state")
    assert response.status_code == 422
    assert response.json() == {
        "detail": [
            {
                "type": "enum",
                "loc": ["query", "state"],
                "msg": "Input should be 'to_verify', 'verified' or 'published'",
                "input": "invalid_state",
                "ctx": {"expected": "'to_verify', 'verified' or 'published'"},
            }
        ]
    }
