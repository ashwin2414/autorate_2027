import {Link,NavLink,useNavigate} from "react-router-dom";
import {logout} from "./api";
import {notifyAuth,useAuth} from "./authState";

// Shows a labelled placeholder (never a wrong picture) if a car photo is missing or fails to load.
const placeholder=(t="AutoRate")=>"data:image/svg+xml;utf8,"+encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#2c2d34'/><stop offset='1' stop-color='#141416'/></linearGradient></defs><rect width='800' height='500' fill='url(#g)'/><text x='400' y='255' font-family='Arial,sans-serif' font-size='40' font-weight='700' fill='#ff6a1a' text-anchor='middle'>${String(t).replace(/[<>&']/g," ")}</text><text x='400' y='300' font-family='Arial,sans-serif' font-size='20' fill='#9a9ca4' text-anchor='middle'>Photo coming soon</text></svg>`);
export function CarImg({src,name,className}){
  return <img className={className} src={src||placeholder(name)} alt={name} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=placeholder(name)}}/>;
}

export function ConfirmDialog({title,message,confirmLabel="Delete",busy=false,onConfirm,onCancel}){
  return <div className="confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onCancel()}}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" onKeyDown={e=>{if(e.key==="Escape"&&!busy)onCancel()}}>
      <span className="confirm-icon" aria-hidden="true">!</span>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-message">{message}</p>
      <div className="confirm-actions">
        <button type="button" className="btn outline" onClick={onCancel} disabled={busy} autoFocus>Cancel</button>
        <button type="button" className="btn danger" onClick={onConfirm} disabled={busy}>{busy?"Deleting...":confirmLabel}</button>
      </div>
    </section>
  </div>;
}

export function Header(){
  const nav=useNavigate();const user=useAuth();
  function signOut(){logout();notifyAuth();nav("/")}
  return <header className="header"><div className="nav container">
    <Link to="/" className="logo"><span className="logo-icon">A</span>Auto<span>Rate</span></Link>
    <nav><NavLink to="/" end>Home</NavLink>{user?.role!=="admin"&&<NavLink to="/cars">Explore cars</NavLink>}<NavLink to="/reviews">Reviews</NavLink><NavLink to="/about">About us</NavLink>{user?.role!=="admin"&&<NavLink to="/contact">Contact</NavLink>}{user?.role==="admin"?<NavLink to="/admin">Admin</NavLink>:user&&<NavLink to="/dashboard">My dashboard</NavLink>}</nav>
    <div className="nav-cta">{user
      ?<><span className="login">Hi, {user.name.split(" ")[0]}</span><button className="btn small" onClick={signOut}>Log out</button></>
      :<><Link to="/login" className="login">Log in</Link><Link to="/register" className="btn small">Join free</Link></>}</div>
  </div></header>
}
export function Footer(){return <footer className="footer"><div className="container footer-grid"><div><Link to="/" className="logo foot-logo"><span className="logo-icon">A</span>Auto<span>Rate</span></Link><p className="foot-about">Helping drivers make confident car decisions through clear information and shared ownership experiences.</p><p className="social-note">Discover better drives. Share what you learn.</p></div><div><h4>Explore</h4><Link to="/cars">Browse cars</Link><Link to="/reviews">Driver reviews</Link><Link to="/about">About AutoRate</Link></div><div><h4>Support</h4><Link to="/contact">Contact us</Link><Link to="/faq">FAQs</Link><a href="mailto:support@autorate.example">Email support</a></div><div><h4>Contact</h4><p>Coimbatore, Tamil Nadu, India</p><a href="mailto:hello@autorate.example">hello@autorate.example</a><a href="tel:+914224000000">+91 422 400 0000</a><p className="hours">Mon–Fri · 9:00 AM–6:00 PM</p></div></div><div className="container copyright"><span>© {new Date().getFullYear()} AutoRate. Student project demonstration.</span><span>Privacy · Terms · Cookie preferences</span></div></footer>}
export function CarCard({car}){return <article className="car-card"><Link to={"/car/"+car.id} className="car-photo"><CarImg src={car.image} name={car.name}/><span>{car.type}</span></Link><div className="car-body"><div className="car-title"><div><small>{car.brand}</small><h3>{car.name}</h3></div><b className="rating">★ {car.rating}</b></div><p className="price">{car.price}</p><div className="car-spec"><span>⛽ {(car.fuel||"").split(" / ")[0]}</span><span>⚙ {(car.gearbox||"").split(" / ")[0]}</span></div><Link className="card-more" to={"/car/"+car.id}>View details <b>→</b></Link></div></article>}
export function ReviewCard({review,actions}){const username=review.username||review.name;return <article className="review-card"><div className="review-head"><div className="avatar">{username?.[0]||"?"}</div><div><b>{username}</b><small>{review.car} · {review.date}</small></div><strong className="rating">★ {review.rating}/5</strong></div>{review.title&&<h3 className="review-title">{review.title}</h3>}<p>{review.comment}</p>{actions&&<div className="review-actions">{actions}</div>}</article>}
