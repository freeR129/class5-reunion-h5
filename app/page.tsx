'use client';
import { useEffect, useRef, useState } from 'react';
import { getVoteResults, submitVote, type VoteResults, type VoteStatus } from './lib/votes';
type Vote = VoteStatus;
const fallbackResults: VoteResults = {attend:30,absent:8,maybe:7};
const timelineData = [
  {year:'2013',events:[
    {date:'2013.08.19—25',title:'高一新生军训',description:'军训里认识大家，也认识了彭同学。',images:['/assets/memories/2013年08月19日-25高一新生军训，认识大家和彭同学.jpg']},
    {date:'2013.10.17',title:'校运动会',description:'校运动会取得总分排名第二的成绩。',images:['/assets/memories/2013年10月17日-校运动会，取得总分排名第二的成绩.jpg']},
    {date:'2013.12.20',title:'太极棍比赛',description:'第一次太极棍比赛，整齐的动作和呐喊都留在了这一天。',images:['/assets/memories/2013年12月20日-第一次太极棍比赛.jpg']},
    {date:'2013.12.25',title:'圣诞惊喜',description:'圣诞节，每个人都惊喜地收到了一只苹果。',images:['/assets/memories/2013年12月25日-圣诞节，每个人惊喜获得一个苹果-1.png','/assets/memories/2013年12月25日-圣诞节，每个人惊喜获得一个苹果-2.jpg']},
  ]},
  {year:'2014',events:[
    {date:'2014.04.03—04',title:'春游',description:'一天台山、自然宽、小磨坊、平乐古镇，沿途都是青春。',images:['/assets/memories/2014年04月03-04日-春游一天台山、自然宽、小磨坊、平乐古镇.jpg']},
    {date:'2014.04.30',title:'“吾爱五班”大扫除',description:'一起动手，把教室和属于五班的记忆擦得闪闪发亮。',images:['/assets/memories/2014年04月30日-“吾爱五班”大扫除-1.jpg','/assets/memories/2014年04月30日-“吾爱五班”大扫除-2.jpg']},
    {date:'2014.06.23',title:'班徽诞生',description:'属于五班的班徽正式成为成品。',images:['/assets/memories/2014年06年23日-班徽出成品.png']},
    {date:'2014.09.10',title:'教师节特别活动',description:'五班为校领导送上教师节祝福。',images:['/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-1.jpg','/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-2.jpg','/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-3.jpg']},
    {date:'2014.09.12',title:'与吴敬琏院士合影',description:'吴敬琏院士回母校作演讲，并与五班同学合影。',images:['/assets/memories/2014年09月12日-著名经济学家吴敬琏院士回母校作演讲，并与五班合影.png']},
    {date:'2014.11.07',title:'班级文化巡礼',description:'班级文化巡礼活动上，五班唱响《黄河在咆哮》。',images:['/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-1.png','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-2.jpg','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-3.jpg']},
    {date:'2014.12.11',title:'接待美国代表团',description:'美国代表团访问学校，五班参与接待。',images:['/assets/memories/2014年12月11日-美国代表团访我校，我班接待-1.jpg','/assets/memories/2014年12月11日-美国代表团访我校，我班接待-2.jpg']},
  ]},
  {year:'2015',events:[
    {date:'2015.04.30',title:'校运动会与四月生日会',description:"五班表演《We're All in This Together》，下午一起庆祝四月生日会。",images:["/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会.png","/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会-2.png"]},
    {date:'2015.09.10',title:'教师颁奖典礼',description:'第一届教师颁奖典礼，记录下感恩与荣光。',images:['/assets/memories/2015年09月10日-第一节教师颁奖典礼.jpg']},
    {date:'2015.10.30',title:'十月生日会',description:'十月生日会，把祝福和笑脸留在了相片里。',images:['/assets/memories/2025年10月30日-十月生日会.jpg']},
  ]},
  {year:'2016',events:[{date:'2016.06',title:'高考',description:'最后一次并肩走进考场，也第一次真正走向各自的远方。',images:[]},{date:'2016.06',title:'毕业',description:'我们认真说了再见，却始终相信，故事还会继续。',images:[]}]},
  {year:'2026',events:[{date:'2016 ··· 2026',title:'再聚',description:'十年光阴继续向前，属于五班的故事在 2026 再次相聚。',images:[]}]},
];
const timelineNodes=timelineData.flatMap(group=>group.events.map(event=>({...event,year:group.year})));
export default function Home() {
  const [page,setPage]=useState(0), [vote,setVote]=useState<Vote|null>(null), [submitting,setSubmitting]=useState<Vote|null>(null), [results,setResults]=useState<VoteResults>(fallbackResults), [videoError,setVideoError]=useState(false), [activeNode,setActiveNode]=useState(0), [musicPlaying,setMusicPlaying]=useState(false);
  const audioRef=useRef<HTMLAudioElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const touch=useRef({x:0,y:0});
  const mouse=useRef({x:0,y:0,scrollLeft:0,dragging:false});
  const wheelLocked=useRef(false);
  useEffect(()=>{const saved=localStorage.getItem('reunion-vote') as Vote|null;if(saved)setVote(saved);getVoteResults().then(setResults).catch(()=>{})},[]);
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
  const castVote=(v:Vote)=>{if(submitting)return;setSubmitting(v);submitVote(v).then(setResults).catch(()=>setResults({...fallbackResults,[v]:fallbackResults[v]+1}));window.setTimeout(()=>{localStorage.setItem('reunion-vote',v);setVote(v);setSubmitting(null)},760)};
  return <main className="h5" onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
    <audio ref={audioRef} src="/assets/bgm.mp3" loop preload="metadata" onPlay={()=>setMusicPlaying(true)} onPause={()=>setMusicPlaying(false)}/>
    <video ref={videoRef} className={`invite-opening-video ${page===1?'is-page-video':''}`} src="/assets/invite-opening-8.mp4" preload="auto" playsInline muted disablePictureInPicture controlsList="nodownload noplaybackrate nofullscreen" onEnded={e=>{const video=e.currentTarget;video.pause();if(Number.isFinite(video.duration))video.currentTime=Math.max(0,video.duration-.08)}} onError={()=>setVideoError(true)}/>
    <button className={`music-control ${musicPlaying?'is-playing':''}`} type="button" aria-label={musicPlaying?'暂停背景音乐':'播放背景音乐'} aria-pressed={musicPlaying} onClick={toggleMusic}><span>♫</span></button>
    <div className="pages" style={{transform:`translate3d(0,-${page*100}dvh,0)`}}>
      <section className="page cover" aria-label="聚会邀请"><div className="grain"/><p className="eyebrow">CLASS FIVE · REUNION</p><div className="title-lockup"><p>高2013级5班</p><img className="reunion-title-art" src="/assets/reunion-title.png" alt="十周年聚会"/><span>2016 — 2026</span></div><button className="invitation-cta" onClick={openInvitation} aria-label="点击开启邀请"><span className="badge-orbit"><img src="/assets/class-badge.png" alt="高2013级5班班徽"/></span><b>点击开启</b><small>ENTER THE REUNION</small></button></section>
      <section className="page video-page" aria-label="青春影像"><div className={`video-fallback ${videoError?'visible':''}`}><div className="film-number">02</div><p>那年今日</p><h2>影像暂不可用</h2><span>请稍后重试或继续上滑浏览</span></div><div className="video-vignette"/><div className="page-label"><span>02</span> 青春影像</div><SwipeHint text="上滑继续"/></section>
      <section className="page timeline-page" aria-label="高中回忆时间轴"><header className="timeline-head"><p>03 · MEMORY LANE</p><h2>我们的高中时光</h2><span>左右滑动，重走 2013—2016</span></header><div className="memory-rail" aria-label="时间轴节点">{timelineNodes.map((node,index)=><button key={`${node.date}-${node.title}`} className={activeNode===index?'active':''} onClick={()=>selectNode(index)}><span>{node.year}</span><i/><small>{node.title}</small></button>)}</div><div className="timeline-track memory-track" onScroll={syncTimeline}>{timelineNodes.map((node,index)=><article className={`memory-slide ${activeNode===index?'is-active':''}`} key={`${node.date}-${node.title}`}><div className="memory-copy"><span>{node.date}</span><h3>{node.title}</h3><p>{node.description}</p></div><div className={`memory-photo tone-${index%4}`}>{node.images.length?node.images.map((src,i)=><img src={src} alt={`${node.title}照片 ${i+1}`} loading="lazy" key={src}/>):<><div className="photo-glow"/><b>{node.year}</b><small>PHOTO · {String(index+1).padStart(2,'0')}</small></>}</div></article>)}</div><div className="timeline-counter"><span>{String(activeNode+1).padStart(2,'0')}</span><i/> {String(timelineNodes.length).padStart(2,'0')}</div><SwipeHint text="上滑赴约"/></section>
      <section className="page vote-page" aria-label="聚会投票">{!vote?<div className={`vote-panel ${submitting?'is-leaving':''}`}><h2>十年之后，<br/>你会来吗？</h2><p className="subtitle">2026，我们再聚一次。</p><div className="choices"><VoteButton code="A" title="算我一个，风雨无阻" selected={submitting==='attend'} disabled={!!submitting} onClick={()=>castVote('attend')}/><VoteButton code="B" title="虽然很想来，但实在排不开，心与你们同在" selected={submitting==='absent'} disabled={!!submitting} onClick={()=>castVote('absent')}/><VoteButton code="C" title="先观望~还不确定，晚点给准信" selected={submitting==='maybe'} disabled={!!submitting} onClick={()=>castVote('maybe')}/></div><p className="vote-loading" role="status" aria-live="polite">{submitting?'正在收好你的回答…':'点击选项即完成投票 · 同一设备可修改'}</p></div>:<div className="success"><div className="success-message"><p className="success-index">2016 · 2026</p><h2>收到！</h2><div className="success-copy"><p>十年以前，<br/>我们在毕业照里站在一起。</p><p>十年以后，<br/>希望这一次，我们还能再见。</p></div><p className="success-ending">期待再次见面</p></div><div className="result-footer"><p className="result-kicker">已有</p><div className="result-grid"><div><strong>{results.absent}</strong><span>人<br/>遗憾缺席</span></div><i/><div><strong>{results.attend}</strong><span>人<br/>确认参加</span></div><i/><div><strong>{results.maybe}</strong><span>人<br/>还不确定</span></div></div><button onClick={()=>{localStorage.removeItem('reunion-vote');setVote(null)}}>修改选择</button></div></div>}</section>
    </div><nav className="dots" aria-label="页面导航">{[0,1,2,3].map(i=><button key={i} className={page===i?'active':''} onClick={()=>goToPage(i)} aria-label={`前往第${i+1}页`}/>)}</nav>
  </main>;
}
function SwipeHint({text}:{text:string}){return <div className="swipe-hint"><span>↑</span><small>{text}</small></div>}
function VoteButton({code,title,selected,disabled,onClick}:{code:string,title:string,selected:boolean,disabled:boolean,onClick:()=>void}){return <button className={selected?'is-selected':''} disabled={disabled} onClick={onClick}><span>{code}</span><b>{title}</b></button>}
