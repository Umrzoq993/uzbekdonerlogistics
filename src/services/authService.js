import axios from "../api/axiosConfig";

/**
 * POST /token (x-www-form-urlencoded)
 * body: grant_type=password, username, password
 * returns: { access_token, token_type }
 */
export async function login(username, password) {
  const form = new URLSearchParams();
  form.set("grant_type", "password");
  form.set("username", username);
  form.set("password", password);

  const res = await axios.post("/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token } = res.data || {};
  if (access_token) localStorage.setItem("access_token", access_token);
  return res.data;
}

export function logout() {
  localStorage.removeItem("access_token");
}
