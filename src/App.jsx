import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6NbmAUZd8tfIT-mEDQS3FQLi5eu8vss4",
  authDomain: "nina-bakes-43d15.firebaseapp.com",
  projectId: "nina-bakes-43d15",
  storageBucket: "nina-bakes-43d15.firebasestorage.app",
  messagingSenderId: "1009106918770",
  appId: "1:1009106918770:web:8dc9476075437e33b851eb",
  measurementId: "G-FJ8YY18DH5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PASSWORD = "baker123";

const defaultDeserts = [
  { id: "1", name: "Chocolate Chip Cookies", emoji: "🍪", price: 3.50, description: "Gooey & golden" },
  { id: "2", name: "Strawberry Cupcakes", emoji: "🧁", price: 4.00, description: "Light & fluffy" },
  { id: "3", name: "Blueberry Muffins", emoji: "🫐", price: 3.00, description: "Bursting with berries" },
];

const styles = {
  app: { fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "linear-gradient(135deg, #fff5f8 0%, #fff9e6 100%)", color: "#3d2c2c" },
  nav: { background: "#ff6b9d", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px #ff6b9d44", position: "sticky", top: 0, zIndex: 10 },
  logo: { fontSize: 22, fontWeight: 800, color: "#fff", padding: "14px 0", cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" },
  navLinks: { display: "flex", gap: 4 },
  navBtn: (active) => ({ background: active ? "#fff" : "transparent", color: active ? "#ff6b9d" : "#fff", border: "none", borderRadius: 20, padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s" }),
  cartBadge: { background: "#ffd166", color: "#3d2c2c", borderRadius: 20, padding: "2px 10px", fontWeight: 800, fontSize: 13, marginLeft: 4 },
  hero: { textAlign: "center", padding: "56px 20px 32px" },
  heroEmoji: { fontSize: 64, display: "block", marginBottom: 8 },
  heroTitle: { fontSize: 42, fontWeight: 900, color: "#ff6b9d", margin: "0 0 8px", letterSpacing: -1 },
  heroSub: { fontSize: 18, color: "#b07070", margin: "0 0 28px" },
  btn: (color = "#ff6b9d") => ({ background: color, color: color === "#ffd166" ? "#3d2c2c" : "#fff", border: "none", borderRadius: 24, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 12px " + color + "55", transition: "transform 0.1s", display: "inline-block" }),
  card: { background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 18px #ff6b9d18", marginBottom: 16 },
  section: { maxWidth: 700, margin: "0 auto", padding: "0 16px 48px" },
  sectionTitle: { fontSize: 26, fontWeight: 800, color: "#ff6b9d", marginBottom: 20, textAlign: "center" },
  desertCard: { display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 20, padding: "16px 20px", boxShadow: "0 4px 18px #ff6b9d18", marginBottom: 14 },
  desertEmoji: { fontSize: 44 },
  input: { width: "100%", borderRadius: 12, border: "2px solid #ffd6e7", padding: "10px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", marginTop: 6 },
  qtyBtn: (c) => ({ background: c, color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, fontWeight: 800, fontSize: 18, cursor: "pointer", lineHeight: 1 }),
  tag: (color) => ({ background: color + "22", color, borderRadius: 12, padding: "2px 10px", fontSize: 12, fontWeight: 700 }),
};

export default function App() {
  const [page, setPage] = useState("home");
  const [deserts, setDeserts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState(false);
  const [adminTab, setAdminTab] = useState("orders");
  const [editingDesert, setEditingDesert] = useState(null);
  const [newDesert, setNewDesert] = useState({ name: "", emoji: "🍰", price: "", description: "" });
  const [showAddDesert, setShowAddDesert] = useState(false);

  useEffect(() => {
    const unsubDeserts = onSnapshot(collection(db, "deserts"), async (snap) => {
      if (snap.empty) {
        for (const d of defaultDeserts) await setDoc(doc(db, "deserts", d.id), d);
      } else {
        setDeserts(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }
      setLoading(false);
    });
    const unsubOrders = onSnapshot(collection(db, "orders"), snap => setOrders(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubFeedback = onSnapshot(collection(db, "feedback"), snap => setFeedback(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => { unsubDeserts(); unsubOrders(); unsubFeedback(); };
  }, []);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const updateCart = (id, delta) => setCart(prev => {
    const next = Math.max(0, Math.min(5, (prev[id] || 0) + delta));
    const updated = { ...prev, [id]: next };
    if (updated[id] === 0) delete updated[id];
    return updated;
  });

  const submitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || Object.keys(cart).length === 0) return;
    await addDoc(collection(db, "orders"), {
      name: customerName.trim(), phone: customerPhone.trim(),
      items: Object.entries(cart).map(([id, qty]) => { const d = deserts.find(d => d.id === id); return { name: d.name, emoji: d.emoji, qty, price: d.price }; }),
      total: Object.entries(cart).reduce((s, [id, qty]) => { const d = deserts.find(d => d.id === id); return s + (d ? d.price * qty : 0); }, 0),
      date: new Date().toLocaleDateString(), status: "Pending"
    });
    setCart({}); setCustomerName(""); setCustomerPhone(""); setOrderSubmitted(true);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    await addDoc(collection(db, "feedback"), { text: feedbackText.trim(), date: new Date().toLocaleDateString() });
    setFeedbackText(""); setFeedbackSubmitted(true);
  };

  const adminLogin = () => {
    if (adminPwInput === ADMIN_PASSWORD) { setAdminAuthed(true); setAdminPwError(false); }
    else setAdminPwError(true);
  };

  const deleteDesert = async (id) => deleteDoc(doc(db, "deserts", id));
  const addDesert = async () => {
    if (!newDesert.name || !newDesert.price) return;
    await addDoc(collection(db, "deserts"), { ...newDesert, price: parseFloat(newDesert.price) });
    setNewDesert({ name: "", emoji: "🍰", price: "", description: "" }); setShowAddDesert(false);
  };
  const saveEditDesert = async () => {
    const { id, ...data } = editingDesert;
    await updateDoc(doc(db, "deserts", id), { ...data, price: parseFloat(data.price) });
    setEditingDesert(null);
  };
  const updateStatus = async (id, status) => updateDoc(doc(db, "orders", id), { status });
  const deleteOrder = async (id) => deleteDoc(doc(db, "orders", id));
  const deleteFeedback = async (id) => deleteDoc(doc(db, "feedback", id));

  if (loading) return <div style={{ textAlign: "center", padding: 80, fontSize: 48 }}>🧁<p style={{ fontSize: 18, color: "#ff6b9d" }}>Loading...</p></div>;

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => setPage("home")}>🧁 Nina Bakes</div>
        <div style={styles.navLinks}>
          {[["home","Home"],["order","Order"],["feedback","Feedback"],["admin","Admin"]].map(([p, label]) => (
            <button key={p} style={styles.navBtn(page === p)} onClick={() => setPage(p)}>
              {label}{p === "order" && totalItems > 0 && <span style={styles.cartBadge}>{totalItems}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <div>
          <div style={styles.hero}>
            <span style={styles.heroEmoji}>🧁</span>
            <h1 style={styles.heroTitle}>Nina Bakes</h1>
            <p style={styles.heroSub}>Fresh homemade goodies, baked with love every week ✨</p>
            <button style={styles.btn()} onClick={() => setPage("order")}>Order This Week →</button>
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>This Week's Menu 🍽️</h2>
            {deserts.map(d => (
              <div key={d.id} style={styles.desertCard}>
                <span style={styles.desertEmoji}>{d.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{d.name}</div>
                  <div style={{ color: "#b07070", fontSize: 14 }}>{d.description}</div>
                </div>
                <div style={{ fontWeight: 800, color: "#ff6b9d", fontSize: 18 }}>${parseFloat(d.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDER */}
      {page === "order" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Place Your Order 🛒</h2>
          {orderSubmitted ? (
            <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 56 }}>🎉</div>
              <h3 style={{ color: "#ff6b9d", fontSize: 24 }}>Order Placed!</h3>
              <p style={{ color: "#b07070" }}>We'll be in touch soon. Thanks for ordering!</p>
              <button style={styles.btn()} onClick={() => setOrderSubmitted(false)}>Order Again</button>
            </div>
          ) : (
            <>
              <div style={styles.card}>
                <h3 style={{ margin: "0 0 14px", color: "#ff6b9d" }}>Your Info</h3>
                <label style={{ fontWeight: 600 }}>Name
                  <input style={styles.input} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your name" />
                </label>
                <div style={{ height: 10 }} />
                <label style={{ fontWeight: 600 }}>Phone
                  <input style={styles.input} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Your phone number" />
                </label>
              </div>
              <h3 style={{ color: "#ff6b9d", fontWeight: 800, margin: "0 0 12px" }}>Choose Your Treats</h3>
              {deserts.map(d => (
                <div key={d.id} style={styles.desertCard}>
                  <span style={styles.desertEmoji}>{d.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    <div style={{ color: "#b07070", fontSize: 13 }}>{d.description} · <strong>${parseFloat(d.price).toFixed(2)}</strong> each</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button style={styles.qtyBtn("#ffb3c6")} onClick={() => updateCart(d.id, -1)}>−</button>
                    <span style={{ fontWeight: 800, fontSize: 18, minWidth: 20, textAlign: "center" }}>{cart[d.id] || 0}</span>
                    <button style={styles.qtyBtn("#ff6b9d")} onClick={() => updateCart(d.id, 1)}>+</button>
                  </div>
                </div>
              ))}
              {totalItems > 0 && (
                <div style={{ ...styles.card, background: "#fff5f8", textAlign: "right" }}>
                  <div style={{ fontSize: 14, color: "#b07070", marginBottom: 4 }}>{totalItems} item{totalItems > 1 ? "s" : ""} selected</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#ff6b9d" }}>
                    Total: ${Object.entries(cart).reduce((s, [id, qty]) => { const d = deserts.find(d => d.id === id); return s + (d ? d.price * qty : 0); }, 0).toFixed(2)}
                  </div>
                  <div style={{ height: 14 }} />
                  <button style={styles.btn()} onClick={submitOrder} disabled={!customerName || !customerPhone}>Confirm Order 🎀</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FEEDBACK */}
      {page === "feedback" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Leave Feedback 💌</h2>
          {feedbackSubmitted ? (
            <div style={{ ...styles.card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48 }}>💖</div>
              <h3 style={{ color: "#ff6b9d" }}>Thank you!</h3>
              <p style={{ color: "#b07070" }}>Your anonymous feedback has been sent.</p>
              <button style={styles.btn()} onClick={() => setFeedbackSubmitted(false)}>Send More</button>
            </div>
          ) : (
            <div style={styles.card}>
              <p style={{ color: "#b07070", marginTop: 0 }}>Your feedback is completely anonymous 🙈</p>
              <textarea
                style={{ ...styles.input, height: 130, resize: "vertical", fontFamily: "inherit" }}
                placeholder="Share your thoughts, suggestions, or compliments..."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
              />
              <div style={{ height: 14 }} />
              <button style={styles.btn()} onClick={submitFeedback} disabled={!feedbackText.trim()}>Send Feedback 💌</button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN */}
      {page === "admin" && (
        <div style={{ ...styles.section, ...(adminAuthed ? {} : { maxWidth: 380, paddingTop: 48 }) }}>
          {!adminAuthed ? (
            <div style={{ ...styles.card, textAlign: "center" }}>
              <div style={{ fontSize: 48 }}>🔑</div>
              <h3 style={{ color: "#ff6b9d" }}>Admin Login</h3>
              <input type="password" style={styles.input} placeholder="Password" value={adminPwInput}
                onChange={e => setAdminPwInput(e.target.value)} onKeyDown={e => e.key === "Enter" && adminLogin()} />
              {adminPwError && <p style={{ color: "#ff4466", fontSize: 13, margin: "6px 0 0" }}>Incorrect password!</p>}
              <div style={{ height: 14 }} />
              <button style={styles.btn()} onClick={adminLogin}>Login</button>
            </div>
          ) : (
            <>
              <h2 style={styles.sectionTitle}>Admin Dashboard 👩‍🍳</h2>
              <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
                {["orders","menu","feedback"].map(tab => (
                  <button key={tab} style={styles.navBtn(adminTab === tab)} onClick={() => setAdminTab(tab)}>
                    {tab === "orders" ? "📋 Orders" : tab === "menu" ? "🍰 Menu" : "💬 Feedback"}
                  </button>
                ))}
                <button style={{ ...styles.navBtn(false), background: "#ff6b9d22", color: "#ff6b9d" }} onClick={() => setAdminAuthed(false)}>Logout</button>
              </div>

              {adminTab === "orders" && (
                <>
                  <p style={{ textAlign: "center", color: "#b07070", marginTop: -12, marginBottom: 20 }}>{orders.length} order{orders.length !== 1 ? "s" : ""} this week</p>
                  {orders.length === 0 && <div style={{ ...styles.card, textAlign: "center", color: "#b07070" }}>No orders yet! 🎀</div>}
                  {orders.map(o => (
                    <div key={o.id} style={styles.card}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: 17 }}>{o.name}</span>
                          <span style={{ marginLeft: 10, color: "#b07070", fontSize: 14 }}>📞 {o.phone}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ borderRadius: 12, border: "2px solid #ffd6e7", padding: "4px 10px", fontWeight: 600, cursor: "pointer" }}>
                            {["Pending","In Progress","Ready","Delivered"].map(s => <option key={s}>{s}</option>)}
                          </select>
                          <button onClick={() => deleteOrder(o.id)} style={{ background: "#ffe0e6", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer", color: "#ff4466", fontWeight: 700 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {o.items.map((item, i) => <span key={i} style={styles.tag("#ff6b9d")}>{item.emoji} {item.name} ×{item.qty}</span>)}
                      </div>
                      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b07070" }}>
                        <span>📅 {o.date}</span>
                        <span style={{ fontWeight: 800, color: "#ff6b9d" }}>Total: ${parseFloat(o.total).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {adminTab === "menu" && (
                <>
                  {deserts.map(d => (
                    <div key={d.id} style={{ ...styles.desertCard, flexWrap: "wrap" }}>
                      {editingDesert?.id === d.id ? (
                        <div style={{ width: "100%" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <input style={{ ...styles.input, width: 60, marginTop: 0 }} value={editingDesert.emoji} onChange={e => setEditingDesert({ ...editingDesert, emoji: e.target.value })} />
                            <input style={{ ...styles.input, flex: 1, marginTop: 0 }} value={editingDesert.name} onChange={e => setEditingDesert({ ...editingDesert, name: e.target.value })} placeholder="Name" />
                            <input style={{ ...styles.input, width: 80, marginTop: 0 }} value={editingDesert.price} onChange={e => setEditingDesert({ ...editingDesert, price: e.target.value })} placeholder="Price" type="number" />
                          </div>
                          <input style={{ ...styles.input, marginTop: 8 }} value={editingDesert.description} onChange={e => setEditingDesert({ ...editingDesert, description: e.target.value })} placeholder="Description" />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button style={styles.btn()} onClick={saveEditDesert}>Save</button>
                            <button style={styles.btn("#b07070")} onClick={() => setEditingDesert(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span style={styles.desertEmoji}>{d.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{d.name}</div>
                            <div style={{ color: "#b07070", fontSize: 13 }}>{d.description}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: "#ff6b9d", marginRight: 8 }}>${parseFloat(d.price).toFixed(2)}</div>
                          <button onClick={() => setEditingDesert({ ...d })} style={{ background: "#fff5f8", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer", marginRight: 4, fontWeight: 700 }}>✏️</button>
                          <button onClick={() => deleteDesert(d.id)} style={{ background: "#ffe0e6", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer", color: "#ff4466", fontWeight: 700 }}>✕</button>
                        </>
                      )}
                    </div>
                  ))}
                  {showAddDesert ? (
                    <div style={styles.card}>
                      <h4 style={{ margin: "0 0 12px", color: "#ff6b9d" }}>Add New Item</h4>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input style={{ ...styles.input, width: 60, marginTop: 0 }} value={newDesert.emoji} onChange={e => setNewDesert({ ...newDesert, emoji: e.target.value })} placeholder="🍰" />
                        <input style={{ ...styles.input, flex: 1, marginTop: 0 }} value={newDesert.name} onChange={e => setNewDesert({ ...newDesert, name: e.target.value })} placeholder="Item name" />
                        <input style={{ ...styles.input, width: 90, marginTop: 0 }} value={newDesert.price} onChange={e => setNewDesert({ ...newDesert, price: e.target.value })} placeholder="Price" type="number" />
                      </div>
                      <input style={{ ...styles.input, marginTop: 8 }} value={newDesert.description} onChange={e => setNewDesert({ ...newDesert, description: e.target.value })} placeholder="Short description" />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button style={styles.btn()} onClick={addDesert}>Add Item</button>
                        <button style={styles.btn("#b07070")} onClick={() => setShowAddDesert(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button style={{ ...styles.btn("#ffd166"), display: "block", width: "100%", textAlign: "center", marginTop: 8 }} onClick={() => setShowAddDesert(true)}>+ Add New Item</button>
                  )}
                </>
              )}

              {adminTab === "feedback" && (
                <>
                  {feedback.length === 0 && <div style={{ ...styles.card, textAlign: "center", color: "#b07070" }}>No feedback yet 💌</div>}
                  {feedback.map(f => (
                    <div key={f.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 15 }}>{f.text}</p>
                        <span style={{ fontSize: 12, color: "#b07070" }}>📅 {f.date}</span>
                      </div>
                      <button onClick={() => deleteFeedback(f.id)} style={{ background: "#ffe0e6", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer", color: "#ff4466", fontWeight: 700, alignSelf: "flex-start" }}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}