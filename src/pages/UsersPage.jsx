import { useEffect, useMemo, useState } from "react";
import { getUsers } from "../api/users";
import {
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Plus, // 🆕
} from "lucide-react";
import UserFormModal from "../components/users/UserFormModal";
import ConfirmDialog from "../components/users/ConfirmDialog";
import styles from "./UsersPage.module.scss";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [newOpen, setNewOpen] = useState(false); // 🆕 create modal
  const [editId, setEditId] = useState(null);
  const [delUser, setDelUser] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.full_name || "").toLowerCase().includes(s) ||
        (r.username || "").toLowerCase().includes(s) ||
        String(r.user_id).includes(s)
    );
  }, [rows, q]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.left}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              placeholder="Qidirish: ism, username yoki ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tools}>
          <button
            className={styles.addBtn}
            onClick={() => setNewOpen(true)}
            title="Yangi foydalanuvchi"
            type="button"
          >
            <Plus size={16} /> Yangi foydalanuvchi
          </button>

          <button
            className={styles.reloadBtn}
            onClick={load}
            disabled={loading}
            title="Yangilash"
            type="button"
          >
            <RefreshCw size={16} /> Yangilash
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>To‘liq ism</th>
              <th>Login</th>
              <th style={{ width: 220 }}>Yaratilgan</th>
              <th style={{ width: 120, textAlign: "right" }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.muted}>
                  Yuklanmoqda...
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((u) => (
                <tr key={u.user_id}>
                  <td className={styles.mono}>{u.user_id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.username}</td>
                  <td>{u.date_created}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.iconBtn}
                      title="Tahrirlash"
                      onClick={() => setEditId(u.user_id)}
                      type="button"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className={styles.iconBtnDanger}
                      title="O‘chirish"
                      onClick={() => setDelUser(u)}
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.muted}>
                  Ma’lumot topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <UserFormModal
        open={newOpen}
        mode="create"
        onClose={() => setNewOpen(false)}
        onSaved={load}
      />

      {/* Edit modal */}
      <UserFormModal
        open={!!editId}
        mode="edit"
        userId={editId}
        onClose={() => setEditId(null)}
        onSaved={load}
      />

      {/* Delete (endpoint kelganda ishlatamiz) */}
      <ConfirmDialog
        open={!!delUser}
        user={delUser}
        onClose={() => setDelUser(null)}
        onDeleted={load}
      />
    </div>
  );
}
