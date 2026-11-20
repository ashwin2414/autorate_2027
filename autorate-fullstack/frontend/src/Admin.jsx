import {useCallback,useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {api,getToken,getUser,realtime,saveSession} from "./api";
import {CarImg,ConfirmDialog} from "./components";
import {notifyAuth,useAuth} from "./authState";

function useLoad(fn){
  const[data,setData]=useState(null);const[error,setError]=useState("");
  const load=useCallback(()=>{setError("");fn().then(setData).catch(e=>setError(e.message))},[]); // eslint-disable-line
  useEffect(load,[load]);
  return[data,error,load];
}
const Err=({e})=>e?<p className="empty">{e}</p>:null;

function Overview(){
  const[s,e,load]=useLoad(api.admin.stats);
  const[refresh,setRefresh]=useState(0);
  useEffect(()=>{const refresh=()=>setRefresh(v=>v+1);realtime.on("car:changed",refresh);return()=>realtime.off("car:changed",refresh)},[]);
  useEffect(()=>{if(refresh)load()},[refresh,load]);
  if(e)return <Err e={e}/>;if(!s)return <p className="muted">Loading...</p>;
  const items=[["Cars",s.cars],["Reviews",s.reviews],["Registered users",s.users],["Admin accounts",s.admins],["Contact messages",s.messages],["Sample reviews",s.sampleReviews],["User-posted reviews",s.userReviews]];
  return <div className="stat-grid">{items.map(([l,v])=><div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
}

const blank={id:"",name:"",brand:"",model:"",type:"Hatchback",year:"",price:"",priceMin:"",rating:"4.0",count:"0",fuel:"Petrol",gearbox:"Manual",mileage:"",engine:"",horsepower:"",seating:"",features:"",image:"",desc:""};
function CarsAdmin(){
  const[data,error,load]=useLoad(()=>api.cars({limit:500,sort:"newest"}));
  const[f,setF]=useState(null);const[editing,setEditing]=useState(null);const[q,setQ]=useState("");const[msg,setMsg]=useState("");
  const[imageBusy,setImageBusy]=useState(false);
  useEffect(()=>{realtime.on("car:changed",load);return()=>realtime.off("car:changed",load)},[load]);
  const set=k=>e=>setF({...f,[k]:e.target.value});
  async function save(e){e.preventDefault();setMsg("");try{const wasEditing=Boolean(editing);wasEditing?await api.admin.updateCar(editing,f):await api.admin.addCar(f);setF(null);setEditing(null);setMsg(wasEditing?"Car updated successfully.":"Car added successfully.");load()}catch(err){setMsg(err.message)}}
  async function findImage(){setMsg("");setImageBusy(true);try{const d=await api.admin.findCarImage(f.name,f.wiki);setF({...f,image:d.image})}catch(err){setMsg(err.message)}finally{setImageBusy(false)}}
  async function del(c){if(!confirm(`Delete ${c.name} and all its reviews?`))return;try{await api.admin.deleteCar(c.id);setMsg("Car deleted successfully.");load()}catch(err){alert(err.message)}}
  if(error)return <Err e={error}/>;if(!data)return <p className="muted">Loading...</p>;
  const list=data.cars.filter(c=>(c.name+c.brand).toLowerCase().includes(q.toLowerCase()));
  const field=(k,label,extra={})=><label className={extra.wide?"wide":""}>{label}<input value={Array.isArray(f[k])?f[k].join(", "):f[k]??""} onChange={set(k)} {...extra.props}/></label>;
  return <>
    <div className="admin-bar"><input placeholder="Search cars..." value={q} onChange={e=>setQ(e.target.value)}/><button className="btn small" onClick={()=>{setF({...blank});setEditing(null);setMsg("")}}>+ Add car</button></div>
    {!f&&msg&&<p className="success">{msg}</p>}
    {f&&<form className="admin-form" onSubmit={save}>
      {field("name","Name",{props:{required:true}})}{!editing&&field("id","Id / slug (optional)")}{field("brand","Brand")}{field("model","Model")}{field("type","Type")}{field("year","Model year",{props:{type:"number",min:"1900",max:"2100"}})}
      {field("price","Price text (e.g. ₹8.00 – 12.00 lakh)")}{field("priceMin","Min price in lakh (for sorting)",{props:{type:"number",step:"0.01"}})}
      {field("rating","Rating",{props:{type:"number",step:"0.1",min:"0",max:"5"}})}{field("count","Rating count",{props:{type:"number"}})}
      {field("fuel","Fuel")}{field("gearbox","Gearbox")}{field("mileage","Mileage / range")}{field("engine","Engine")}{field("horsepower","Horsepower",{props:{type:"number",min:"0"}})}{field("seating","Seating capacity",{props:{type:"number",min:"1"}})}{field("features","Features (comma separated)",{wide:true})}
      {field("wiki","Wikipedia article (optional)",{wide:true})}{field("image","Image URL (leave empty for placeholder)",{wide:true})}<button type="button" className="btn small outline wide" disabled={imageBusy||!f.name} onClick={findImage}>{imageBusy?"Finding image...":"Find image automatically"}</button><div className="wide image-preview"><CarImg className="preview-photo" src={f.image} name={f.name||"Car preview"}/><span className="muted">{f.image?"Image preview":"No photo selected; placeholder will be used"}</span></div>{field("desc","Description",{wide:true})}
      <div className="wide row-actions"><button className="btn small">{editing?"Save changes":"Create car"}</button><button type="button" className="btn small outline" onClick={()=>setF(null)}>Cancel</button>{msg&&<span className="empty">{msg}</span>}</div>
    </form>}
    <div className="table-wrap"><table className="admin-table"><thead><tr><th>Photo</th><th>Name</th><th>Type</th><th>Price</th><th>Rating</th><th></th></tr></thead><tbody>
      {list.length?list.map(c=><tr key={c.id}><td><CarImg className="thumb" src={c.image} name={c.name}/></td><td><b>{c.name}</b><br/><small className="muted">{c.id}</small></td><td>{c.type}</td><td>{c.price}</td><td>★ {c.rating}</td>
        <td><div className="row-actions"><Link className="btn small outline" to={"/car/"+c.id}>View</Link><button className="btn small outline" onClick={()=>{setF({...blank,...c,priceMin:c.priceMin??"",rating:c.rating??"",count:c.count??""});setEditing(c.id);setMsg("");window.scrollTo(0,0)}}>Edit</button><button className="btn small danger" onClick={()=>del(c)}>Delete</button></div></td></tr>):<tr><td colSpan="6" className="muted">{q?"No matching cars found.":"No cars found. Add your first car."}</td></tr>}
    </tbody></table></div></>
}

function ReviewsAdmin(){
  const[data,error,load]=useLoad(()=>api.reviews({limit:500}));const[q,setQ]=useState("");const[editing,setEditing]=useState(null);const[draft,setDraft]=useState(null);const[msg,setMsg]=useState("");const[deleteError,setDeleteError]=useState("");const[deleteTarget,setDeleteTarget]=useState(null);const[deleting,setDeleting]=useState(false);
  useEffect(()=>{
    const refresh=()=>load();
    realtime.on("review:new",refresh);realtime.on("review:updated",refresh);realtime.on("review:deleted",refresh);
    return()=>{realtime.off("review:new",refresh);realtime.off("review:updated",refresh);realtime.off("review:deleted",refresh)};
  },[load]);
  async function save(e){e.preventDefault();setMsg("");try{await api.updateReview(editing,draft);setEditing(null);setDraft(null);setMsg("Review updated successfully.");load()}catch(err){setMsg(err.message)}}
  async function del(){
    if(!deleteTarget)return;
    setDeleteError("");setDeleting(true);
    try{await api.deleteReview(deleteTarget.id);setMsg("Review deleted successfully.");setDeleteTarget(null);load()}
    catch(e){setDeleteError(e.message)}
    finally{setDeleting(false)}
  }
  if(error)return <Err e={error}/>;if(!data)return <p className="muted">Loading...</p>;
  const list=data.reviews.filter(r=>(r.car+r.username+r.name+r.comment).toLowerCase().includes(q.toLowerCase()));
  return <><div className="admin-bar"><input placeholder="Search reviews..." value={q} onChange={e=>setQ(e.target.value)}/><span className="muted">{list.length} reviews</span></div>
  {msg&&<p className="success">{msg}</p>}
  {deleteError&&<p className="empty" role="alert">Could not delete review: {deleteError}</p>}
  {draft&&<form className="admin-form" onSubmit={save}><h3 className="wide">Edit review for {draft.car}</h3>
    <label>Rating<select required value={draft.rating} onChange={e=>setDraft({...draft,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label>
    <label className="wide">Review<textarea required minLength="10" maxLength="3000" rows="4" value={draft.comment} onChange={e=>setDraft({...draft,comment:e.target.value})}/></label>
    <div className="wide row-actions"><button className="btn small">Save review</button><button type="button" className="btn small outline" onClick={()=>{setEditing(null);setDraft(null)}}>Cancel</button></div>
  </form>}
  <div className="table-wrap"><table className="admin-table"><thead><tr><th>Car</th><th>By</th><th>Rating</th><th>Review</th><th></th></tr></thead><tbody>
    {list.length?list.map(r=><tr key={r.id}><td>{r.car}</td><td>{r.username||r.name}{!r.userId&&<> <span className="pill">sample</span></>}</td><td>★ {r.rating}</td><td className="clip">{r.comment}</td><td><div className="row-actions"><button className="btn small outline" onClick={()=>{setEditing(r.id);setDraft({rating:r.rating,comment:r.comment,car:r.car});setMsg("")}}>Edit</button><button className="btn small danger" onClick={()=>{setDeleteError("");setDeleteTarget(r)}}>Delete</button></div></td></tr>):<tr><td colSpan="5" className="muted">No reviews found. Users can add one from a car details page.</td></tr>}
  </tbody></table></div>
  {deleteTarget&&<ConfirmDialog title="Delete this review?" message={`The review of ${deleteTarget.car} by ${deleteTarget.username||deleteTarget.name} will be permanently removed.`} confirmLabel="Delete review" busy={deleting} onConfirm={del} onCancel={()=>setDeleteTarget(null)}/>}
  </>
}

function UsersAdmin(){
  const[data,error,load]=useLoad(api.admin.users);
  async function del(u){if(!confirm(`Delete ${u.name} and their reviews?`))return;try{await api.admin.deleteUser(u.id);load()}catch(e){alert(e.message)}}
  if(error)return <Err e={error}/>;if(!data)return <p className="muted">Loading...</p>;
  return <div className="table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Joined</th><th></th></tr></thead><tbody>
    {data.users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.username||"-"}</td><td><span className={"pill "+(u.role==="admin"?"admin":"")}>{u.role}</span></td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td>{u.role!=="admin"&&<button className="btn small danger" onClick={()=>del(u)}>Delete</button>}</td></tr>)}
  </tbody></table></div>
}

function MessagesAdmin(){
  const[data,error,load]=useLoad(api.admin.messages);
  async function del(m){try{await api.admin.deleteMessage(m.id);load()}catch(e){alert(e.message)}}
  if(error)return <Err e={error}/>;if(!data)return <p className="muted">Loading...</p>;
  if(!data.messages.length)return <p className="muted">No contact messages yet.</p>;
  return <div className="review-list">{data.messages.map(m=><article className="review-card" key={m.id}><div className="review-head"><div className="avatar">{m.name[0]}</div><div><b>{m.name}</b><small>{m.email} · {new Date(m.createdAt).toLocaleString()}</small></div></div><p><b>{m.subject}</b></p><p>{m.message}</p><button className="btn small danger" onClick={()=>del(m)}>Delete</button></article>)}</div>
}

function ProfileAdmin(){
  const[data,error,load]=useLoad(api.admin.profile);
  const[f,setF]=useState(null);const[pw,setPw]=useState({currentPassword:"",newPassword:""});const[msg,setMsg]=useState("");const[pmsg,setPmsg]=useState("");
  useEffect(()=>{if(data)setF({name:data.admin.name,username:data.admin.username,email:data.admin.email,phone:data.admin.phone})},[data]);
  if(error)return <Err e={error}/>;if(!data||!f)return <p className="muted">Loading...</p>;
  async function save(e){e.preventDefault();setMsg("");try{const d=await api.admin.updateProfile(f);const u=getUser();saveSession({token:getToken(),user:{...u,name:d.admin.name,email:d.admin.email,username:d.admin.username}});notifyAuth();setMsg("Saved to database");load()}catch(err){setMsg(err.message)}}
  async function changePw(e){e.preventDefault();setPmsg("");try{await api.admin.changePassword(pw);setPw({currentPassword:"",newPassword:""});setPmsg("Password updated")}catch(err){setPmsg(err.message)}}
  const a=data.admin;
  return <div className="admin-two"><form className="admin-form" onSubmit={save}><h3 className="wide">My admin details</h3>
    <label>Full name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
    <label>Username<input required value={f.username} onChange={e=>setF({...f,username:e.target.value})}/></label>
    <label>Email<input required type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label>
    <label>Phone<input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></label>
    <p className="wide muted">Created {new Date(a.createdAt).toLocaleString()} · Last login {a.lastLoginAt?new Date(a.lastLoginAt).toLocaleString():"-"}</p>
    <div className="wide row-actions"><button className="btn small">Save details</button>{msg&&<span className={msg.startsWith("Saved")?"success":"empty"}>{msg}</span>}</div></form>
    <form className="admin-form" onSubmit={changePw}><h3 className="wide">Change password</h3>
    <label className="wide">Current password<input required type="password" value={pw.currentPassword} onChange={e=>setPw({...pw,currentPassword:e.target.value})}/></label>
    <label className="wide">New password (min 6 characters)<input required minLength="6" type="password" value={pw.newPassword} onChange={e=>setPw({...pw,newPassword:e.target.value})}/></label>
    <div className="wide row-actions"><button className="btn small">Update password</button>{pmsg&&<span className={pmsg==="Password updated"?"success":"empty"}>{pmsg}</span>}</div></form></div>
}

function AdminsAdmin(){
  const me=useAuth();const[data,error,load]=useLoad(api.admin.admins);
  const blankA={name:"",username:"",email:"",phone:"",password:""};const[f,setF]=useState(null);const[msg,setMsg]=useState("");
  async function add(e){e.preventDefault();setMsg("");try{await api.admin.addAdmin(f);setF(null);load()}catch(err){setMsg(err.message)}}
  async function del(a){if(!confirm(`Delete admin ${a.username}?`))return;try{await api.admin.deleteAdmin(a.id);load()}catch(e){alert(e.message)}}
  if(error)return <Err e={error}/>;if(!data)return <p className="muted">Loading...</p>;
  const k=key=>e=>setF({...f,[key]:e.target.value});
  return <><div className="admin-bar"><span className="muted">{data.admins.length} admin account(s) stored in the database</span><button className="btn small" onClick={()=>{setF({...blankA});setMsg("")}}>+ Add admin</button></div>
    {f&&<form className="admin-form" onSubmit={add}><label>Full name<input required value={f.name} onChange={k("name")}/></label><label>Username<input required value={f.username} onChange={k("username")}/></label><label>Email<input required type="email" value={f.email} onChange={k("email")}/></label><label>Phone<input value={f.phone} onChange={k("phone")}/></label><label>Password<input required minLength="6" type="password" value={f.password} onChange={k("password")}/></label>
      <div className="wide row-actions"><button className="btn small">Create admin</button><button type="button" className="btn small outline" onClick={()=>setF(null)}>Cancel</button>{msg&&<span className="empty">{msg}</span>}</div></form>}
    <div className="table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Created</th><th>Last login</th><th></th></tr></thead><tbody>
      {data.admins.map(a=><tr key={a.id}><td>{a.name}</td><td>{a.username} <span className="pill admin">admin</span></td><td>{a.email}</td><td>{a.phone||"-"}</td><td>{new Date(a.createdAt).toLocaleDateString()}</td><td>{a.lastLoginAt?new Date(a.lastLoginAt).toLocaleString():"-"}</td><td>{String(a.id)!==String(me?.id)&&<button className="btn small danger" onClick={()=>del(a)}>Delete</button>}</td></tr>)}
    </tbody></table></div></>
}

const TABS=[["overview","Overview",Overview],["cars","Cars",CarsAdmin],["reviews","Reviews",ReviewsAdmin],["users","Users",UsersAdmin],["admins","Admins",AdminsAdmin],["profile","My profile",ProfileAdmin],["messages","Messages",MessagesAdmin]];
export default function Admin(){
  const user=useAuth();const[tab,setTab]=useState("overview");
  if(!user||user.role!=="admin")return <main className="container page form-page"><div className="form-card"><small className="eyebrow">RESTRICTED</small><h1>Admin area</h1><p className="muted">Please log in with an admin account to continue.</p><Link className="btn full" to="/admin-login">Go to admin login</Link></div></main>;
  const Active=TABS.find(t=>t[0]===tab)[2];
  return <main className="container page"><div className="page-title"><small className="eyebrow">ADMIN DASHBOARD</small><h1>Manage AutoRate</h1><p>Manage cars, moderate reviews, view users, manage admin accounts and read contact messages.</p></div>
    <div className="tabs">{TABS.map(([k,l])=><button key={k} className={"tab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>{l}</button>)}</div><Active/></main>
}
