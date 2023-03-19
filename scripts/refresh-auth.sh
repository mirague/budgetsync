#!/bin/bash

# Define a timestamp function
timestamp() {
  date +"%F_%T"
}

TS=$(timestamp)
echo "Timestamp: $TS"

# 1. Get Auth Token
NORDIGEN_TOKEN=$(
  curl -s -X POST "https://ob.nordigen.com/api/v2/token/new/" \
    -H 'accept: application/json' \
    -H 'Content-Type: application/json' \
    -d '{
        "secret_id": "'"$SECRET_ID"'",
        "secret_key": "'"$SECRET_KEY"'"
    }' | jq -r ".access"
)
echo "NORDIGEN_TOKEN: $NORDIGEN_TOKEN"

# 2. Create new EUA (/api/agreements/enduser/) with a unique reference
EUA_ID=$(
  curl -s -X POST "https://ob.nordigen.com/api/v2/agreements/enduser/" \
    -H  "accept: application/json" \
    -H  "Content-Type: application/json" \
    -H  "Authorization: Bearer ${NORDIGEN_TOKEN}" \
    -d '{"institution_id": "NORDEA_NDEASESS",
        "max_historical_days": "180",
        "access_valid_for_days": "90",
        "access_scope": ["balances", "details", "transactions"]
    }' | jq -r ".id"
)
echo "EUA_ID: $EUA_ID"

# 3. Create a new requisition and get auth link
URL=$(
  curl -s -X POST "https://ob.nordigen.com/api/v2/requisitions/" \
    -H "accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${NORDIGEN_TOKEN}" \
    -d '{"redirect": "http://example.com",
        "institution_id": "NORDEA_NDEASESS",
        "reference": "melvin-'"${TS}"'",
        "agreement": "'"${EUA_ID}"'",
        "user_language":"EN"
    }' | jq '.link'
)

echo "URL: $URL"
echo "Opening URL in browser..."
open -a /Applications/Safari.app $URL
