import axios from "../api/axiosConfig";

export async function createUser(payload) {
  // payload: { full_name, username, password }
  const { data } = await axios.post("/create_user", payload);
  return data;
}
