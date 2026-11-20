import {useEffect,useMemo,useRef,useState} from "react";
import {Routes,Route,Link,useParams,useNavigate,useLocation} from "react-router-dom";
import {api,getUser,realtime} from "./api";
import {Header,Footer,CarCard,ReviewCard,CarImg,ConfirmDialog} from "./components";
import {notifyAuth,useAuth} from "./authState";
import Admin from "./Admin";

function useCars(limit=500){
  const[s,setS]=useState({cars:[],loading:true,error:""});
  useEffect(()=>{
    let active=true;
    const load=()=>api.cars({limit,sort:limit===6?"newest":"default"}).then(d=>{
      if(active)setS({cars:d.cars,loading:false,error:""});
    }).catch(e=>{if(active)setS({cars:[],loading:false,error:e.message})});
    load();
    realtime.on("car:changed",load);
    return()=>{active=false;realtime.off("car:changed",load)};
  },[limit]);
  return s;
}

function HeroFeatureIcon({type}){
  return <svg className="hero-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {type==="car"
      ?<><path d="M3 16.5h18l-1.5-6H6L3 13v3.5Z"/><path d="m6 10.5 1.5-4h9l2 4M7 13h.01M17 13h.01M7 17v1m10-1v1"/></>
      :type==="star"
        ?<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z"/>
        :<><path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 5-6"/><path d="M16 7h3v3"/></>}
  </svg>;
}

function Home(){
  const{cars}=useCars(6);const[reviews,setReviews]=useState([]);
  useEffect(()=>{api.reviews({limit:4}).then(d=>setReviews(d.reviews)).catch(()=>{})},[]);
  return <>
    <section className="hero hero-home">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="kicker">THE DRIVER-FIRST CAR COMMUNITY</div>
          <h1><span>Make your next</span><span>car choice with</span><em>confidence.</em></h1>
          <p className="hero-copy">Independent perspectives, practical ownership insights and real experiences to help you find a car that fits your life.</p>
          <div className="hero-actions">
            <Link className="btn" to="/cars">Explore cars <b>→</b></Link>
            <Link className="btn outline" to="/about">Why AutoRate?</Link>
          </div>
          <div className="hero-metrics">
            <div className="hero-metric"><HeroFeatureIcon type="car"/><span><b>Car guides</b><small>Clear information</small></span></div>
            <div className="hero-metric"><HeroFeatureIcon type="star"/><span><b>Owner voices</b><small>Shared experiences</small></span></div>
            <div className="hero-metric"><HeroFeatureIcon type="trend"/><span><b>Smart choices</b><small>Compare with context</small></span></div>
          </div>
        </div>
        <figure className="hero-visual">
          <div className="hero-photo-frame">
            <img src="/images/autorate-lamborghini-hero.jpg" alt="Orange Lamborghini driving along a tree-lined road"/>
          </div>
          <div className="hero-info-card">
            <span className="hero-info-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21 3-7.5 18-3.8-7.7L2 9.5 21 3Z"/><path d="M9.7 13.3 15 8"/></svg>
            </span>
            <span className="hero-info-copy"><b>Find your kind of drive.</b><small>Research · Compare · Decide</small></span>
            <Link className="hero-info-arrow" to="/cars" aria-label="Explore cars">→</Link>
          </div>
          <a className="hero-photo-credit" href="https://www.pexels.com/search/orange%20lamborghini%20road/" target="_blank" rel="noreferrer">Photo via Pexels</a>
        </figure>
      </div>
      <a className="scroll-indicator" href="#latest-guides"><span aria-hidden="true"/>Scroll to explore</a>
    </section>
    <section id="latest-guides" className="container section">
      <div className="section-head"><div><small className="eyebrow">A GOOD PLACE TO START</small><h2>Latest car guides</h2><p>Explore recently added models and learn what ownership may look like.</p></div><Link className="inline-link" to="/cars">Browse all cars →</Link></div>
      <div className="car-grid">{cars.slice(0,6).map(c=><CarCard key={c.id} car={c}/>)}</div>
    </section>
    <section className="value-band"><div className="container value-grid"><div><span>01</span><h3>Research clearly</h3><p>Understand key specifications, categories and ownership considerations in one place.</p></div><div><span>02</span><h3>Learn from drivers</h3><p>Read practical experiences that go beyond a specification sheet.</p></div><div><span>03</span><h3>Share responsibly</h3><p>Help other shoppers by sharing a balanced and useful review.</p></div></div></section>
    <section className="container section"><div className="section-head"><div><small className="eyebrow">COMMUNITY VOICES</small><h2>Experiences from drivers</h2><p>Recent reviews from the AutoRate community.</p></div><Link className="inline-link" to="/reviews">Read all reviews →</Link></div><div className="review-grid">{reviews.map(r=><ReviewCard key={r.id} review={r}/>)}</div></section>
    <section className="container callout"><div><small className="eyebrow">YOUR EXPERIENCE MATTERS</small><h2>Have a car story to share?</h2><p>Join the community and help other drivers make informed decisions.</p></div><Link className="btn" to="/register">Create an account →</Link></section>
  </>;
}

function UserDashboard(){
  const user=useAuth();const{cars,loading,error}=useCars(6);
  if(!user)return <main className="container page form-page"><div className="form-card"><small className="eyebrow">YOUR AUTORATE ACCOUNT</small><h1>Log in to continue</h1><p className="muted">Sign in to see your dashboard and the latest cars.</p><Link className="btn full" to="/login">Log in</Link></div></main>;
  if(user.role==="admin")return <main className="container page"><h1>Admin account</h1><p className="muted">Open the admin dashboard to manage cars and images.</p><Link className="btn" to="/admin">Go to admin dashboard →</Link></main>;
  return <main className="container page"><div className="page-title"><small className="eyebrow">YOUR AUTORATE DASHBOARD</small><h1>Welcome back, {user.name.split(" ")[0]}</h1><p>Browse recently added cars, view their photos and find your next guide.</p></div><div className="section-head"><div><small className="eyebrow">JUST ADDED</small><h2>Latest car guides</h2></div><Link className="inline-link" to="/cars">Explore all cars →</Link></div>{error&&<p className="empty">Could not load cars: {error}</p>}{loading&&<p className="muted">Loading cars...</p>}<div className="car-grid">{cars.map(c=><CarCard key={c.id} car={c}/>)}</div>{!loading&&!error&&!cars.length&&<p className="muted">No cars are available yet.</p>}</main>;
}

const SORTS={popular:(a,b)=>(b.count||0)-(a.count||0),newest:(a,b)=>new Date(b.createdAt)-new Date(a.createdAt),rating:(a,b)=>b.rating-a.rating,low:(a,b)=>(a.priceMin||0)-(b.priceMin||0),high:(a,b)=>(b.priceMin||0)-(a.priceMin||0),name:(a,b)=>a.name.localeCompare(b.name)};
function Cars(){
  const[cars,setCars]=useState([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
  const[filters,setFilters]=useState({brands:[],types:[]});
  const[q,setQ]=useState("");const[type,setType]=useState("All");const[brand,setBrand]=useState("All");const[sort,setSort]=useState("popular");const[shown,setShown]=useState(12);
  const requestId=useRef(0);const[refresh,setRefresh]=useState(0);
  useEffect(()=>{
    const refreshCars=()=>setRefresh(v=>v+1);
    const refreshFilters=()=>api.carFilters().then(setFilters).catch(e=>setError(e.message));
    realtime.on("car:changed",refreshCars);
    realtime.on("car:changed",refreshFilters);
    refreshFilters();
    return()=>{realtime.off("car:changed",refreshCars);realtime.off("car:changed",refreshFilters)};
  },[]);
  useEffect(()=>{
    const current=++requestId.current;
    const timer=setTimeout(()=>{
      setLoading(true);setError("");
      api.cars({search:q.trim(),type:type==="All"?"":type,brand:brand==="All"?"":brand,limit:500,sort:"newest"})
        .then(d=>{if(current===requestId.current)setCars(d.cars)})
        .catch(e=>{if(current===requestId.current)setError(e.message)})
        .finally(()=>{if(current===requestId.current)setLoading(false)});
    },q?250:0);
    return()=>clearTimeout(timer);
  },[q,type,brand,refresh]);
  useEffect(()=>setShown(12),[q,type,brand,sort]);
  const types=["All",...filters.types];
  const brands=["All",...filters.brands];
  const filtered=useMemo(()=>{
    let l=cars;
    if(SORTS[sort])l=[...l].sort(SORTS[sort]);return l;
  },[cars,sort]);
  return <main className="container page"><div className="page-title"><small className="eyebrow">FIND A CAR THAT FITS</small><h1>Explore cars</h1><p>Search by model or brand, then open a guide for more details.</p></div>
    <div className="filters"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search cars, brands, or types..."/>
      <select value={type} onChange={e=>setType(e.target.value)}>{types.map(t=><option key={t} value={t}>{t==="All"?"All types":t}</option>)}</select>
      <select value={brand} onChange={e=>setBrand(e.target.value)}>{brands.map(b=><option key={b} value={b}>{b==="All"?"All brands":b}</option>)}</select>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Sort: Popular</option><option value="newest">Sort: Newest</option><option value="rating">Rating: high to low</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name: A to Z</option></select></div>
    {loading&&<p className="muted">Loading cars...</p>}
    {error&&<p className="empty">Could not load cars: {error}. Is the backend running?</p>}
    {!loading&&!error&&<p className="muted">Showing {Math.min(shown,filtered.length)} of {filtered.length} cars</p>}
    <div className="car-grid">{filtered.slice(0,shown).map(c=><CarCard key={c.id} car={c}/>)}</div>
    {!loading&&!error&&!filtered.length&&<p className="empty">No matching cars found. Try a different search.</p>}
    {shown<filtered.length&&<div className="center"><button className="btn outline" onClick={()=>setShown(shown+12)}>Show more cars</button></div>}
  </main>
}

function Details(){
  const{id}=useParams();const[car,setCar]=useState(null);const[reviews,setReviews]=useState([]);const[status,setStatus]=useState("loading");const{cars}=useCars();
  useEffect(()=>{
    let active=true;
    const load=()=>api.car(id).then(d=>{if(active){setCar(d.car);setReviews(d.reviews);setStatus("ok")}}).catch(()=>{if(active)setStatus("missing")});
    setStatus("loading");window.scrollTo(0,0);load();
    const onCarChange=event=>{if(event.id===id||event.car?.id===id)load()};
    realtime.on("car:changed",onCarChange);
    return()=>{active=false;realtime.off("car:changed",onCarChange)};
  },[id]);
  if(status==="loading")return <main className="container page"><p className="muted">Loading...</p></main>;
  if(status==="missing"||!car)return <main className="container page"><h1>Car not found</h1><Link to="/cars">Back to cars</Link></main>;
  const similar=cars.filter(c=>c.type===car.type&&c.id!==car.id).slice(0,3);
  return <main className="container page"><Link className="inline-link" to="/cars">← Back to cars</Link>
    <div className="details"><div><CarImg className="detail-img" src={car.image} name={car.name}/><h2>About the {car.name}</h2><p className="body-copy">{car.desc}</p><p className="disclaimer">Specifications and price ranges are illustrative sample content for this student project. Verify current variant-wise details with the manufacturer or an authorised dealer.</p></div>
    <aside className="spec-panel"><small className="eyebrow">{car.brand} · {car.type}</small><h1>{car.name}</h1><b className="rating">★ {car.rating} <small>({car.count} ratings)</small></b><h2>{car.price}</h2>{[["Year",car.year],["Engine",car.engine],["Fuel",car.fuel],["Transmission",car.gearbox],["Mileage",car.mileage],["Horsepower",car.horsepower?`${car.horsepower} hp`:""],["Seating",car.seating?`${car.seating} seats`:""]].filter(([,value])=>value).map(([label,value])=><div className="spec-row" key={label}><span>{label}</span><b>{value}</b></div>)}{Array.isArray(car.features)&&car.features.length>0&&<div className="spec-row"><span>Features</span><b>{car.features.join(", ")}</b></div>}<Link className="btn full" to={"/add-review/"+car.id}>Write a review →</Link></aside></div>
    {reviews.length>0&&<section className="block"><h2>Reviews for the {car.name}</h2><div className="review-list">{reviews.map(r=><ReviewCard key={r.id} review={r}/>)}</div></section>}
    {similar.length>0&&<section className="block"><h2>More {car.type} cars</h2><div className="car-grid">{similar.map(c=><CarCard key={c.id} car={c}/>)}</div></section>}
  </main>
}

function Reviews(){
  const location=useLocation();const nav=useNavigate();
  const user=useAuth();const[reviews,setReviews]=useState([]);const[error,setError]=useState("");const[car,setCar]=useState("All");const[stars,setStars]=useState("All");const[shown,setShown]=useState(24);
  const[deleteNotice,setDeleteNotice]=useState("");const[deleteError,setDeleteError]=useState("");const[deleting,setDeleting]=useState(null);const[deleteTarget,setDeleteTarget]=useState(null);
  const[submitted,setSubmitted]=useState(Boolean(location.state?.reviewSubmitted));
  useEffect(()=>{
    api.reviews({limit:500}).then(d=>setReviews(d.reviews)).catch(e=>setError(e.message));
    const onNew=r=>setReviews(p=>p.some(x=>x.id===r.id)?p:[r,...p]);
    const onUpdated=r=>setReviews(p=>p.map(x=>x.id===r.id?r:x));
    const onDeleted=({id})=>setReviews(p=>p.filter(x=>x.id!==id));
    realtime.on("review:new",onNew);
    realtime.on("review:updated",onUpdated);
    realtime.on("review:deleted",onDeleted);
    return()=>{
      realtime.off("review:new",onNew);
      realtime.off("review:updated",onUpdated);
      realtime.off("review:deleted",onDeleted);
    };
  },[]);
  useEffect(()=>{
    if(location.state?.reviewSubmitted)nav(location.pathname,{replace:true,state:null});
  },[location,nav]);
  useEffect(()=>setShown(24),[car,stars]);
  const carNames=["All",...[...new Set(reviews.map(r=>r.car))].sort()];
  const list=reviews.filter(r=>(car==="All"||r.car===car)&&(stars==="All"||r.rating===Number(stars)));
  function requestDelete(review){setDeleteNotice("");setDeleteError("");setDeleteTarget(review)}
  async function remove(){
    if(!deleteTarget)return;
    const id=deleteTarget.id;
    setDeleteNotice("");setDeleteError("");setDeleting(id);
    try{
      await api.deleteReview(id);
      setReviews(current=>current.filter(review=>review.id!==id));
      setDeleteNotice("Review deleted successfully.");
      setDeleteTarget(null);
    }catch(e){setDeleteError(e.message)}
    finally{setDeleting(null)}
  }
  return <main className="container page"><div className="page-title"><small className="eyebrow">DRIVER EXPERIENCES</small><h1>Community reviews</h1><p>Read practical feedback from people sharing their driving experiences.</p></div>
    <div className="filters"><select value={car} onChange={e=>setCar(e.target.value)}>{carNames.map(n=><option key={n} value={n}>{n==="All"?"All cars":n}</option>)}</select><select value={stars} onChange={e=>setStars(e.target.value)}><option value="All">All ratings</option>{[5,4,3].map(n=><option key={n} value={n}>{n} stars</option>)}</select></div>
    {submitted&&<p className="success" role="status">Review submitted successfully!</p>}
    {deleteNotice&&<p className="success" role="status">{deleteNotice}</p>}
    {deleteError&&<p className="empty" role="alert">Could not delete review: {deleteError}</p>}
    {error&&<p className="empty">Could not load reviews: {error}</p>}
    <p className="muted">Showing {Math.min(shown,list.length)} of {list.length} reviews</p>
    <div className="review-list">{list.slice(0,shown).map(r=><ReviewCard key={r.id} review={r} actions={user&&(r.userId===user.id||user.role==="admin")&&<button className="btn outline small" disabled={deleting===r.id} onClick={()=>requestDelete(r)}>{user.role==="admin"&&r.userId!==user.id?"Delete (admin)":"Delete my review"}</button>}/>)}</div>
    {shown<list.length&&<div className="center"><button className="btn outline" onClick={()=>setShown(shown+24)}>Show more reviews</button></div>}
    {deleteTarget&&<ConfirmDialog title="Delete this review?" message={`Your review of ${deleteTarget.car} will be permanently removed. This action cannot be undone.`} confirmLabel="Delete review" busy={deleting===deleteTarget.id} onConfirm={remove} onCancel={()=>setDeleteTarget(null)}/>}
  </main>
}

function AddReview(){
  const{id}=useParams();const nav=useNavigate();const user=useAuth();
  const[car,setCar]=useState(null);const[missing,setMissing]=useState(false);const[rating,setRating]=useState("5");const[title,setTitle]=useState("");const[comment,setComment]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);
  useEffect(()=>{api.car(id).then(d=>setCar(d.car)).catch(()=>setMissing(true))},[id]);
  async function submit(e){e.preventDefault();setError("");setBusy(true);try{const result=await api.addReview({car:car.id,title:title.trim(),rating:Number(rating),comment:comment.trim()});if(!result.review?.id)throw new Error("The server did not confirm the saved review");nav("/reviews",{state:{reviewSubmitted:true}})}catch(err){setError(err.message);setBusy(false)}}
  if(missing)return <main className="container page">Car not found</main>;
  if(!car)return <main className="container page"><p className="muted">Loading...</p></main>;
  if(!user)return <main className="container page form-page"><div className="form-card"><small className="eyebrow">SHARE YOUR EXPERIENCE</small><h1>Log in to review {car.name}</h1><p className="muted">You need a free account to post a review.</p><Link className="btn full" to="/login">Log in</Link><p className="muted">New here? <Link className="inline-link" to="/register">Join free</Link></p></div></main>;
  return <main className="container page form-page"><form className="form-card" onSubmit={submit}><small className="eyebrow">SHARE YOUR EXPERIENCE</small><h1>Review {car.name}</h1><p className="muted">Posting as <b>{user.username||user.name}</b></p><label>Rating<select value={rating} onChange={e=>setRating(e.target.value)}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label><label>Review title<input required minLength="3" maxLength="120" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Summarize your experience"/></label><label>Your review<textarea required minLength="10" maxLength="3000" rows="5" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share what went well and what could be improved..."/></label>{error&&<p className="empty">{error}</p>}<button className="btn full" disabled={busy}>{busy?"Submitting...":"Submit review"}</button></form></main>
}

function About(){return <main className="container page"><div className="page-title"><small className="eyebrow">WHO WE ARE</small><h1>About AutoRate</h1><p>A driver-first space for researching cars and learning from shared experiences.</p></div><div className="about-layout"><div><h2>Better information for better journeys.</h2><p className="body-copy">AutoRate is a car discovery and review platform concept created to make car research easier to understand. We bring car information, community feedback and practical ownership perspectives together in one accessible place.</p><p className="body-copy">Our goal is to help visitors ask better questions, compare the details that matter to them and make their own informed decisions. We encourage respectful, specific and honest reviews.</p></div><div className="about-card"><h3>What we value</h3><p><b>Clarity</b><br/>Information presented in a simple, useful way.</p><p><b>Community</b><br/>Different experiences and perspectives matter.</p><p><b>Transparency</b><br/>Sample content and limitations are clearly identified.</p></div></div><div className="notice"><b>Project transparency</b><p>AutoRate in this version is a student project demonstration. It is not an official vehicle-rating agency, dealer, manufacturer or commercial company. Reviews and some vehicle details are sample data.</p></div></main>}

function Contact(){
  const[f,setF]=useState({name:"",email:"",subject:"",message:""});const[sent,setSent]=useState(false);const[error,setError]=useState("");const[busy,setBusy]=useState(false);const set=k=>e=>setF({...f,[k]:e.target.value});
  async function submit(e){e.preventDefault();setError("");setBusy(true);try{await api.contact(f);setSent(true);setF({name:"",email:"",subject:"",message:""})}catch(err){setError(err.message)}setBusy(false)}
  return <main className="container page"><div className="page-title"><small className="eyebrow">WE'RE HERE TO HELP</small><h1>Contact us</h1><p>Questions, feedback or suggestions? Send us a message.</p></div><div className="contact-layout"><form className="form-card" onSubmit={submit}><h2>Send us a message</h2><label>Name<input required placeholder="Your name" value={f.name} onChange={set("name")}/></label><label>Email<input required type="email" placeholder="you@example.com" value={f.email} onChange={set("email")}/></label><label>Subject<input required placeholder="How can we help?" value={f.subject} onChange={set("subject")}/></label><label>Message<textarea required rows="5" placeholder="Write your message..." value={f.message} onChange={set("message")}/></label><button className="btn full" disabled={busy}>{busy?"Sending...":"Send message"}</button>{sent&&<p className="success">Thanks! Your message has been received.</p>}{error&&<p className="empty">{error}</p>}</form><div className="contact-info"><div><small className="eyebrow">CONTACT DETAILS</small><h2>Get in touch</h2><p>For this project demo, use the sample contact information below.</p></div><p><b>✉ Email</b><br/><a href="mailto:hello@autorate.example">hello@autorate.example</a></p><p><b>☎ Phone</b><br/><a href="tel:+914224000000">+91 422 400 0000</a></p><p><b>⌖ Location</b><br/>Coimbatore, Tamil Nadu, India</p><p><b>◷ Office hours</b><br/>Monday–Friday, 9:00 AM–6:00 PM</p></div></div></main>
}

function FAQ(){
  const[faqs,setFaqs]=useState([]);const[error,setError]=useState("");
  useEffect(()=>{api.faqs().then(d=>setFaqs(d.faqs)).catch(e=>setError(e.message))},[]);
  return <main className="container page"><div className="page-title"><small className="eyebrow">HELP CENTRE</small><h1>Frequently asked questions</h1></div>{error&&<p className="empty">Could not load FAQs: {error}</p>}{faqs.map(({q,a})=><details className="faq" key={q}><summary>{q}</summary><p>{a}</p></details>)}</main>
}

function Auth({register=false,adminLogin=false}){
  const nav=useNavigate();const[name,setName]=useState("");const[username,setUsername]=useState("");const[login,setLogin]=useState("");const[password,setPassword]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault();setError("");setBusy(true);try{
    if(register)await api.register(name,login,password,username);else if(adminLogin)await api.adminLogin(login,password);else await api.login(login,password);
    notifyAuth();nav(adminLogin?"/admin":getUser()?.role==="admin"?"/admin":"/dashboard");
  }catch(err){setError(err.message);setBusy(false)}}
  return <main className="container page form-page"><form className="form-card" onSubmit={submit}><small className="eyebrow">{adminLogin?"ADMINISTRATOR ACCESS":"AUTORATE COMMUNITY"}</small><h1>{register?"Create an account":adminLogin?"Admin sign in":"Welcome back"}</h1>
    {register&&<label>Full name<input required placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/></label>}
    {register&&<label>Username (optional)<input autoComplete="username" minLength="3" maxLength="30" pattern="[A-Za-z0-9._-]+" placeholder="e.g. roadtripfan" value={username} onChange={e=>setUsername(e.target.value)}/></label>}
    <label>{register?"Email address":"Email or username"}<input required type={register?"email":"text"} autoComplete="username" placeholder={register?"you@example.com":adminLogin?"Admin email or username":"you@example.com or username"} value={login} onChange={e=>setLogin(e.target.value)}/></label>
    <label>Password<input required type="password" minLength={register?6:1} placeholder="At least 6 characters" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    {error&&<p className="empty">{error}</p>}
    <button className="btn full" disabled={busy}>{busy?"Please wait...":register?"Create account":adminLogin?"Log in as Admin":"Log in"}</button>
    {!register&&!adminLogin&&<Link className="admin-login-link" to="/admin-login">Log in as Admin</Link>}
    <p className="muted">{register?<>Already registered? <Link className="inline-link" to="/login">Log in</Link></>:adminLogin?<>Back to <Link className="inline-link" to="/login">user login</Link></>:<>New here? <Link className="inline-link" to="/register">Join free</Link></>}</p></form></main>
}

export default function App(){return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/cars" element={<Cars/>}/><Route path="/car/:id" element={<Details/>}/><Route path="/reviews" element={<Reviews/>}/><Route path="/add-review/:id" element={<AddReview/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/faq" element={<FAQ/>}/><Route path="/login" element={<Auth key="login"/>}/><Route path="/admin-login" element={<Auth key="admin-login" adminLogin/>}/><Route path="/register" element={<Auth key="register" register/>}/><Route path="/dashboard" element={<UserDashboard/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<main className="container page"><h1>Page not found</h1><Link to="/">Return home</Link></main>}/></Routes><Footer/></>}
