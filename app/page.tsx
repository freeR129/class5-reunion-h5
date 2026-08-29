'use client';
import { useEffect, useRef, useState } from 'react';
type Vote = 'attend' | 'maybe' | 'absent';
const timelineData = [
  {year:'2013',events:[{date:'2013.09',title:'初见',description:'第一次坐进那个教室，我们还不知道，接下来的三年，会成为青春里最难忘的一段。',images:[]}]},
  {year:'2014',events:[{date:'2014.04',title:'春游',description:'风吹过笑脸，也吹过那条一起走了很远的路。',images:[]},{date:'2014.10',title:'运动会',description:'跑道、呐喊和递到手里的那瓶水，都是青春最明亮的注脚。',images:[]}]},
  {year:'2015',events:[{date:'2015.01',title:'元旦晚会',description:'灯光亮起，我们在歌声里把平凡的一天变成了纪念日。',images:[]},{date:'2015.05',title:'篮球赛',description:'比分已经记不清了，只记得全班一起欢呼的声音。',images:[]}]},
  {year:'2016',events:[{date:'2016.06',title:'高考',description:'最后一次并肩走进考场，也第一次真正走向各自的远方。',images:[]},{date:'2016.06',title:'毕业',description:'我们认真说了再见，却始终相信，故事还会继续。',images:[]}]},
];
const timelineNodes=timelineData.flatMap(group=>group.events.map(event=>({...event,year:group.year})));
export default function Home() {
  const [page,setPage]=useState(0), [vote,setVote]=useState<Vote|null>(null), [submitting,setSubmitting]=useState<Vote|null>(null), [videoError,setVideoError]=useState(false), [activeNode,setActiveNode]=useState(0), [musicPlaying,setMusicPlaying]=useState(false);
  const audioRef=useRef<HTMLAudioElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const touch=useRef({x:0,y:0});
  const mouse=useRef({x:0,y:0,scrollLeft:0,dragging:false});
  const wheelLocked=useRef(false);
  useEffect(()=>{ const saved=localStorage.getItem('reunion-vote') as Vote|null; if(saved)setVote(saved); },[]);
  const goToPage=(i:number)=>setPage(Math.max(0,Math.min(3,i)));
  const onStart=(e:React.TouchEvent)=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onEnd=(e:React.TouchEvent)=>{const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>48)goToPage(page+(dy<0?1:-1))};
  const getTrack=()=>document.querySelector('.timeline-track') as HTMLDivElement|null;
  const getRail=()=>document.querySelector('.memory-rail') as HTMLDivElement|null;
  const onMouseDown=(e:React.MouseEvent)=>{mouse.current={x:e.clientX,y:e.clientY,scrollLeft:getTrack()?.scrollLeft??0,dragging:true}};
  const onMouseMove=(e:React.MouseEvent)=>{if(!mouse.current.dragging)return;const track=getTrack();if(page===2&&Math.abs(e.clientX-mouse.current.x)>Math.abs(e.clientY-mouse.current.y)&&track)track.scrollLeft=mouse.current.scrollLeft-(e.clientX-mouse.current.x)};
  const onMouseUp=(e:React.MouseEvent)=>{if(!mouse.current.dragging)return;mouse.current.dragging=false;const dx=e.clientX-mouse.current.x,dy=e.clientY-mouse.current.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>48)goToPage(page+(dy<0?1:-1))};
  const onWheel=(e:React.WheelEvent)=>{if(wheelLocked.current||Math.abs(e.deltaY)<30)return;wheelLocked.current=true;goToPage(page+(e.deltaY>0?1:-1));window.setTimeout(()=>{wheelLocked.current=false},760)};
  const centerRailNode=(index:number)=>{const rail=getRail(),node=rail?.querySelectorAll<HTMLElement>('button')[index];if(rail&&node)rail.scrollTo({left:node.offsetLeft-(rail.clientWidth-node.clientWidth)/2,behavior:'smooth'})};
  const selectNode=(index:number)=>{const track=getTrack(),slide=track?.querySelectorAll<HTMLElement>('.memory-slide')[index];if(track&&slide){track.scrollTo({left:slide.offsetLeft-(track.clientWidth-slide.clientWidth)/2,behavior:'smooth'});centerRailNode(index);setActiveNode(index)}};
  const syncTimeline=()=>{const track=getTrack();if(!track)return;const center=track.scrollLeft+track.clientWidth/2;let closest=0,distance=Infinity;track.querySelectorAll<HTMLElement>('.memory-slide').forEach((slide,index)=>{const d=Math.abs(slide.offsetLeft+slide.clientWidth/2-center);if(d<distance){distance=d;closest=index}});if(closest!==activeNode){setActiveNode(closest);centerRailNode(closest)}};
  const playMusic=()=>{const audio=audioRef.current;if(!audio)return;audio.play().catch(()=>setMusicPlaying(false))};
  const toggleMusic=()=>{const audio=audioRef.current;if(!audio)return;if(audio.paused)playMusic();else audio.pause()};
  useEffect(()=>{const video=videoRef.current;if(!video)return;if(page===1)video.play().catch(()=>{});else{video.pause();if(page===0)video.currentTime=0}},[page]);
  const openInvitation=()=>{playMusic();goToPage(1)};
  const castVote=(v:Vote)=>{if(submitting)return;setSubmitting(v);window.setTimeout(()=>{localStorage.setItem('reunion-vote',v);setVote(v);setSubmitting(null)},850)};
  const results={attend:30+(vote==='attend'?1:0),absent:8+(vote==='absent'?1:0),maybe:7+(vote==='maybe'?1:0)};
  return <main className="h5" onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
    <audio ref={audioRef} src="/assets/bgm.mp3" loop preload="metadata" onPlay={()=>setMusicPlaying(true)} onPause={()=>setMusicPlaying(false)}/>
    <video ref={videoRef} className={`invite-opening-video ${page===1?'is-page-video':''}`} src="/assets/invite-opening-8.mp4" preload="auto" playsInline muted controls={page===1} onError={()=>setVideoError(true)}/>
    <button className={`music-control ${musicPlaying?'is-playing':''}`} type="button" aria-label={musicPlaying?'暂停背景音乐':'播放背景音乐'} aria-pressed={musicPlaying} onClick={toggleMusic}><span>♫</span></button>
    <div className="pages" style={{transform:`translate3d(0,-${page*100}dvh,0)`}}>
      <section className="page cover" aria-label="聚会邀请"><div className="grain"/><p className="eyebrow">CLASS FIVE · REUNION</p><div className="title-lockup"><p>给2013级5班的</p><h1 className="invite-title">聚会邀请</h1></div><button className="invitation-cta" onClick={openInvitation} aria-label="点击开启邀请"><span className="badge-orbit"><img src="/assets/class-badge.png" alt="高2013级5班班徽"/></span><b>点击开启</b><small>ENTER THE REUNION</small></button></section>
      <section className="page video-page" aria-label="青春影像"><div className={`video-fallback ${videoError?'visible':''}`}><div className="film-number">02</div><p>那年今日</p><h2>影像暂不可用</h2><span>请稍后重试或继续上滑浏览</span></div><div className="video-vignette"/><div className="page-label"><span>02</span> 青春影像</div><SwipeHint text="上滑继续"/></section>
      <section className="page timeline-page" aria-label="高中回忆时间轴"><header className="timeline-head"><p>03 · MEMORY LANE</p><h2>我们的高中时光</h2><span>左右滑动，重走 2013—2016</span></header><div className="memory-rail" aria-label="时间轴节点">{timelineNodes.map((node,index)=><button key={`${node.date}-${node.title}`} className={activeNode===index?'active':''} onClick={()=>selectNode(index)}><span>{node.year}</span><i/><small>{node.title}</small></button>)}</div><div className="timeline-track memory-track" onScroll={syncTimeline}>{timelineNodes.map((node,index)=><article className="memory-slide" key={`${node.date}-${node.title}`}><div className="memory-copy"><span>{node.date}</span><h3>{node.title}</h3><p>{node.description}</p></div><div className={`memory-photo tone-${index%4}`}>{node.images.length?node.images.map((src,i)=><img src={src} alt={`${node.title}照片 ${i+1}`} loading="lazy" key={src}/>):<><div className="photo-glow"/><b>{node.year}</b><small>PHOTO · {String(index+1).padStart(2,'0')}</small></>}</div></article>)}</div><div className="timeline-counter"><span>{String(activeNode+1).padStart(2,'0')}</span><i/> {String(timelineNodes.length).padStart(2,'0')}</div><SwipeHint text="上滑赴约"/></section>
      <section className="page vote-page" aria-label="聚会投票">{!vote?<div className={`vote-panel ${submitting?'is-leaving':''}`}><p className="eyebrow">04 · THE PROMISE</p><h2>十年之后，<br/>你会来吗？</h2><p className="subtitle">2026，我们再聚一次。</p><div className="choices"><VoteButton code="A" title="算我一个，风雨无阻" note="一定要认出彼此" selected={submitting==='attend'} disabled={!!submitting} onClick={()=>castVote('attend')}/><VoteButton code="B" title="虽然很想来，但实在排不开，心与你们同在" note="跨过山海来见你" selected={submitting==='absent'} disabled={!!submitting} onClick={()=>castVote('absent')}/><VoteButton code="C" title="先观望~还不确定，晚点给准信" note="下一次，不缺席" selected={submitting==='maybe'} disabled={!!submitting} onClick={()=>castVote('maybe')}/></div><p className="vote-loading" role="status" aria-live="polite">{submitting?'正在收好你的回答…':'点击选项即完成投票 · 同一设备可修改'}</p></div>:<div className="success"><div className="success-message"><p className="success-index">2016 · 2026</p><h2>收到！</h2><div className="success-copy"><p>十年以前，<br/>我们在毕业照里站在一起。</p><p>十年以后，<br/>希望这一次，我们还能再见。</p></div><p className="success-ending">期待再次见面</p></div><div className="result-footer"><p className="result-kicker">已有</p><div className="result-grid"><div><strong>{results.attend}</strong><span>人<br/>确认参加</span></div><i/><div><strong>{results.absent}</strong><span>人<br/>遗憾缺席</span></div><i/><div><strong>{results.maybe}</strong><span>人<br/>还不确定</span></div></div><button onClick={()=>{localStorage.removeItem('reunion-vote');setVote(null)}}>修改选择</button></div></div>}<div className="down-hint">⌄<span>下滑回望</span></div></section>
    </div><nav className="dots" aria-label="页面导航">{[0,1,2,3].map(i=><button key={i} className={page===i?'active':''} onClick={()=>goToPage(i)} aria-label={`前往第${i+1}页`}/>)}</nav>
  </main>;
}
function SwipeHint({text}:{text:string}){return <div className="swipe-hint"><span>↑</span><small>{text}</small></div>}
function VoteButton({code,title,note,selected,disabled,onClick}:{code:string,title:string,note:string,selected:boolean,disabled:boolean,onClick:()=>void}){return <button className={selected?'is-selected':''} disabled={disabled} onClick={onClick}><span>{code}</span><b>{title}</b><i>{note}</i></button>}
