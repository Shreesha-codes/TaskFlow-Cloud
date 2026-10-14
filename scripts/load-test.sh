#!/usr/bin/env bash
# Load generation script to simulate traffic and trigger Kubernetes HPA autoscaling
TARGET_URL=${1:-"http://taskboard.local/api/tasks"}
CONCURRENCY=${2:-10}
REQUESTS=${3:-1000}

echo "=========================================================="
echo " Starting Load Test on TaskBoard Backend"
echo " Target: $TARGET_URL"
echo " Concurrency: $CONCURRENCY"
echo " Total Requests: $REQUESTS"
echo "=========================================================="

if command -v hey &> /dev/null; then
    hey -n "$REQUESTS" -c "$CONCURRENCY" "$TARGET_URL"
elif command -v ab &> /dev/null; then
    ab -n "$REQUESTS" -c "$CONCURRENCY" "$TARGET_URL"
else
    echo "Running basic curl loop..."
    for i in $(seq 1 "$REQUESTS"); do
        curl -s -o /dev/null -w "%{http_code}\n" "$TARGET_URL" &
        if (( i % CONCURRENCY == 0 )); then
            wait
        fi
    done
    wait
fi

echo "=========================================================="
echo " Load test complete! Check HPA via: kubectl get hpa -n taskboard"
echo "=========================================================="
