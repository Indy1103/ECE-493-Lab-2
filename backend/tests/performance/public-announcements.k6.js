import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 100,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    checks: ["rate>0.99"]
  }
};

export default function () {
  const response = http.get("https://cms.example.com/api/public/announcements");
  check(response, {
    "status is 200 or 503": (result) => result.status === 200 || result.status === 503
  });
  sleep(0.1);
}
