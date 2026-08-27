'use client';
import { useEffect, useRef, useState } from 'react';
type Vote = 'attend' | 'maybe' | 'absent';
const timeline = [
  { year: 2013, months: ['09','10','11','12'], note: '初见 · 新校服与陌生的名字', tone: 'sepia' },
  { year: 2014, months: ['01','03','05','07','09','11'], note: '并肩 · 操场、晚自习和没说完的话', tone: 'green' },
  { year: 2015, months: ['01','03','05','07','09','11'], note: '盛夏 · 我们把青春写进试卷背面', tone: 'blue' },
  { year: 2016, months: ['01','03','05','06'], note: '告别 · 前程似锦，后会有期', tone: 'gold' },
];
export default function Home() {
  const [page,setPage]=useState(0), [opened,setOpened]=useState(false), [vote,setVote]=useState<Vote|null>(null), [videoError,setVideoError]=useState(false);
  const touch=useRef({x:0,y:0});
  const mouse=useRef({x:0,y:0,scrollLeft:0,dragging:false});
  const wheelLocked=useRef(false);
  useEffect(()=>{ const saved=localStorage.getItem('reunion-vote') as Vote|null; if(saved)setVote(saved); },[]);
  const goToPage=(i:number)=>setPage(Math.max(0,Math.min(3,i)));
  const onStart=(e:React.TouchEvent)=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onEnd=(e:React.TouchEvent)=>{const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>48)goToPage(page+(dy<0?1:-1))};
  const getTrack=()=>document.querySelector('.timeline-track') as HTMLDivElement|null;
  const onMouseDown=(e:React.MouseEvent)=>{mouse.current={x:e.clientX,y:e.clientY,scrollLeft:getTrack()?.scrollLeft??0,dragging:true}};
  const onMouseMove=(e:React.MouseEvent)=>{if(!mouse.current.dragging)return;const track=getTrack();if(page===2&&Math.abs(e.clientX-mouse.current.x)>Math.abs(e.clientY-mouse.current.y)&&track)track.scrollLeft=mouse.current.scrollLeft-(e.clientX-mouse.current.x)};
  const onMouseUp=(e:React.MouseEvent)=>{if(!mouse.current.dragging)return;mouse.current.dragging=false;const dx=e.clientX-mouse.current.x,dy=e.clientY-mouse.current.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>48)goToPage(page+(dy<0?1:-1))};
  const onWheel=(e:React.WheelEvent)=>{if(wheelLocked.current||Math.abs(e.deltaY)<30)return;wheelLocked.current=true;goToPage(page+(e.deltaY>0?1:-1));window.setTimeout(()=>{wheelLocked.current=false},760)};
  const openEnvelope=()=>{setOpened(true);window.setTimeout(()=>goToPage(1),650)};
  const castVote=(v:Vote)=>{localStorage.setItem('reunion-vote',v);setVote(v)};
  return <main className="h5" onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
    <div className="pages" style={{transform:`translate3d(0,-${page*100}dvh,0)`}}>
      <section className="page cover" aria-label="聚会邀请"><div className="grain"/><p className="eyebrow">CLASS FIVE · REUNION</p><div className="title-lockup"><p>高2013级5班</p><h1>十周年聚会</h1><span>2016 — 2026</span></div><button className={`envelope ${opened?'is-open':''}`} onClick={openEnvelope} aria-label="点击开启邀请"><span className="letter"><b>致我们</b><i>的青春</i></span><span className="envelope-back"/><span className="envelope-front"/><span className="flap"/><span className="seal">伍</span></button><button className="open-hint" onClick={openEnvelope}>点击开启 <span>↗</span></button><SwipeHint text="上滑启程"/></section>
      <section className="page video-page" aria-label="青春影像">{!videoError&&<video src="/reunion.mp4" poster="/video-poster.jpg" playsInline controls preload="metadata" onError={()=>setVideoError(true)}/>}<div className={`video-fallback ${videoError?'visible':''}`}><div className="film-number">02</div><p>那年今日</p><h2>影像待续</h2><span>把 reunion.mp4 放入 public 文件夹即可播放</span></div><div className="video-vignette"/><div className="page-label"><span>02</span> 青春影像</div><SwipeHint text="上滑继续"/></section>
      <section className="page timeline-page" aria-label="高中回忆时间轴"><header className="timeline-head"><p>03 · MEMORY LANE</p><h2>我们的高中时光</h2><span>左右滑动，重走 2013—2016</span></header><div className="timeline-track">{timeline.map((item,index)=><article className="year-card" key={item.year}><div className={`photo-stack ${item.tone}`} aria-hidden="true"><span/><span/><strong>{String(index+1).padStart(2,'0')}</strong></div><div className="year-copy"><h3>{item.year}</h3><p>{item.note}</p></div><div className="months">{item.months.map((m,i)=><span key={m} className={i===0?'active':''}><i/>{m}月</span>)}</div></article>)}</div><div className="timeline-rule"><span>2013</span><i/><span>2016</span></div><SwipeHint text="上滑赴约"/></section>
      <section className="page vote-page" aria-label="聚会投票"><div className="vote-orbit" aria-hidden="true"><span>2013</span><i>10</i><span>2026</span></div>{!vote?<div className="vote-panel"><p className="eyebrow">04 · THE PROMISE</p><h2>十年之后，<br/>你会来吗？</h2><p className="subtitle">2026，我们再聚一次。</p><div className="choices"><VoteButton code="A" title="我一定来" note="一定要认出彼此" onClick={()=>castVote('attend')}/><VoteButton code="B" title="尽量赶来" note="跨过山海来见你" onClick={()=>castVote('maybe')}/><VoteButton code="C" title="这次遗憾缺席" note="下一次，不缺席" onClick={()=>castVote('absent')}/></div><small>点击选项即完成投票 · 同一设备可修改</small></div>:<div className="success"><div className="success-mark">✓</div><p>收到！</p><h2>期待再次见面。</h2><span>你的选择已被珍藏</span><button onClick={()=>{localStorage.removeItem('reunion-vote');setVote(null)}}>修改选择</button></div>}<div className="down-hint">⌄<span>下滑回望</span></div></section>
    </div><nav className="dots" aria-label="页面导航">{[0,1,2,3].map(i=><button key={i} className={page===i?'active':''} onClick={()=>goToPage(i)} aria-label={`前往第${i+1}页`}/>)}</nav>
  </main>;
}
function SwipeHint({text}:{text:string}){return <div className="swipe-hint"><span>↑</span><small>{text}</small></div>}
function VoteButton({code,title,note,onClick}:{code:string,title:string,note:string,onClick:()=>void}){return <button onClick={onClick}><span>{code}</span><b>{title}</b><i>{note}</i></button>}
