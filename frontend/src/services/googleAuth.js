/**
 * Google OAuth — One Tap popup with id_token.
 * Email and name come directly from the id_token JWT — no extra API call needed.
 * This eliminates the ~1-2s UserInfo API round trip.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function googleLogin() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID not set"));
      return;
    }
    if (typeof google === "undefined" || !google.accounts) {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }

    const timer = setTimeout(() => reject(new Error("popup_closed")), 30000);

    // Use the id_token-based flow — Google returns the credential (JWT)
    // which already contains email, name, and picture — no XHR needed.
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "email profile openid",
      callback: (response) => {
        clearTimeout(timer);
        if (response.error) {
          reject(new Error(response.error === "user_cancelled" ? "popup_closed" : response.error));
          return;
        }

        // Decode id_token JWT to get email/name (saves ~1-2s vs UserInfo API call)
        if (response.id_token) {
          try {
            const parts = response.id_token.split(".");
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            resolve({
              email: payload.email,
              name: payload.name || payload.given_name || payload.email?.split("@")[0] || "",
            });
            return;
          } catch {
            // fall through to access_token approach
          }
        }

        // Fallback: use access_token via UserInfo API (slower)
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "https://www.googleapis.com/oauth2/v2/userinfo");
        xhr.setRequestHeader("Authorization", "Bearer " + response.access_token);
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data && data.email) {
                resolve({
                  email: data.email,
                  name: data.name || data.given_name || data.email.split("@")[0],
                });
              } else {
                reject(new Error("No email returned"));
              }
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error("Google API error: " + xhr.status));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send();
      },
    });

    client.requestAccessToken();
  });
}
