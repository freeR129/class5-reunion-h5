'use client';
import { useEffect, useRef, useState } from 'react';
import { getVoteResults, submitVote, type VoteResults, type VoteStatus } from './lib/votes';
import { decodeImageForDisplay, MemoryPhotoStack, PhotoLightbox, type PhotoPreview } from './components/MemoryPhotos';
type Vote = VoteStatus;
type VoteUiState = 'idle' | 'submitting' | 'success' | 'error';
type TimelineDirection = 'forward' | 'backward';
type TimelinePrefetchTask = {src:string;priority:'high'|'low'};
const emptyVoteResults: VoteResults = {attend:0,absent:0,maybe:0,total:0};
const confirmedVoteStorageKey = 'cloudbase-reunion-vote-v1';
const timelineData = [
  {year:'2013',events:[
    {date:'2013.08.19—25',title:'高一新生军训',description:'军训里认识大家，也认识了彭同学。',images:['/assets/memories/2013年08月19日-25高一新生军训，认识大家和彭同学.webp']},
    {date:'2013.10.17',title:'校运动会',description:'',images:['/assets/memories/2013年10月17日-校运动会，取得总分排名第二的成绩-1.webp','/assets/memories/2013年10月17日-校运动会，取得总分排名第二的成绩-2.jpg']},
    {date:'2013.12.20',title:'第一次太极棍比赛',description:'',images:['/assets/memories/2013年12月20日-第一次太极棍比赛-2.jpg','/assets/memories/2013年12月20日-第一次太极棍比赛-3.jpg']},
    {date:'2013.12.25',title:'圣诞惊喜',description:'圣诞节，每个人都惊喜地收到了一只苹果。',images:['/assets/memories/2013年12月25日-圣诞节，每个人惊喜获得一个苹果-1.jpg']},
    {date:'2013.12.31',title:'跨年联欢会',description:'与四班一起跨年联欢，全班合唱《无与伦比的美丽》。',images:['/assets/memories/2013年12月31日-与四班跨年联欢会，全班合唱《无与伦比的美丽》-1.jpg','/assets/memories/2013年12月31日-与四班跨年联欢会，全班合唱《无与伦比的美丽》-2.jpg','/assets/memories/2013年12月31日-与四班跨年联欢会，全班合唱《无与伦比的美丽》-3.jpg','/assets/memories/2013年12月31日-与四班跨年联欢会，全班合唱《无与伦比的美丽》-4.jpg']},
  ]},
  {year:'2014',events:[
    {date:'2014.04.03—04',title:'春游',description:'春游——天台山、自然宽、小磨坊、平乐古镇',images:['/assets/memories/2014年04月03-04日-春游一天台山、自然宽、小磨坊、平乐古镇-1.jpg','/assets/memories/2014年04月03-04日-春游一天台山、自然宽、小磨坊、平乐古镇-2.jpg','/assets/memories/2014年04月03-04日-春游一天台山、自然宽、小磨坊、平乐古镇-3.jpg']},
    {date:'2014.04.30',title:'“吾爱五班”大扫除',description:'',images:['/assets/memories/2014年04月30日-“吾爱五班”大扫除-2.webp','/assets/memories/2014年04月30日-“吾爱五班”大扫除-3.jpg','/assets/memories/2014年04月30日-“吾爱五班”大扫除-4.jpg']},
    {date:'2014.06.23',title:'班徽诞生',description:'一把伞下的五班',images:['/assets/memories/2014年06年23日-班徽出成品.webp','/assets/memories/2014年06年23日-班徽出成品-2.jpg','/assets/memories/2014年06年23日-班徽出成品-3.jpg']},
    {date:'2014.09.10',title:'教师节特别活动',description:'',images:['/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-1.webp','/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-2.webp','/assets/memories/2014年09月10日-5班教师节特别活动，为校领导送祝福-3.webp']},
    {date:'2014.09.12',title:'与吴敬琏院士合影',description:'吴敬琏院士回母校作演讲，并与五班同学合影。',images:['/assets/memories/2014年09月12日-著名经济学家吴敬琏院士回母校作演讲，并与五班合影-1.webp','/assets/memories/2014年09月12日-著名经济学家吴敬琏院士回母校作演讲，并与五班合影-2.jpg','/assets/memories/2014年09月12日-著名经济学家吴敬琏院士回母校作演讲，并与五班合影-3.jpg']},
    {date:'2014.11.07',title:'班级文化巡礼',description:'班级文化巡礼活动——黄河在咆哮',images:['/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-1.webp','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-4.webp','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-5.webp','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-6.webp','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-7-竖版.png','/assets/memories/2014年11月07日-班级文化巡礼活动-黄河在咆哮-8.webp']},
    {date:'2014.12.11',title:'接待美国代表团',description:'美国代表访问学校，在广场表演太极棍',images:['/assets/memories/2014年12月11日-美国代表团访我校，我班接待-1.webp','/assets/memories/2014年12月11日-美国代表团访我校，我班接待-2.webp']},
    {date:'2014.12.12',title:'第二次太极棍比赛',description:'',images:['/assets/memories/2014年12月12日-第二次太极棍比赛.jpg']},
  ]},
  {year:'2015',events:[
    {date:'2015.03.05',title:'元宵煮汤圆',description:'',images:['/assets/memories/2015年03月05日-元宵煮汤圆，吃汤圆.webp']},
    {date:'2015.04.02',title:'石板滩社会实践',description:'暴走、野炊、雏鹰基地三件套',images:['/assets/memories/2015年04月02日-石板滩社会实践(暴走，野炊，雏鹰基地三件套)-1.jpg','/assets/memories/2015年04月02日-石板滩社会实践(暴走，野炊，雏鹰基地三件套)-4.jpg','/assets/memories/2015年04月02日-石板滩社会实践(暴走，野炊，雏鹰基地三件套)-8.jpg','/assets/memories/2015年04月02日-石板滩社会实践(暴走，野炊，雏鹰基地三件套)-9.jpg']},
    {date:'2015.04.30',title:'校运动会与四月生日会',description:"表演《We're All in This Together》，下午一起庆祝四月生日会。",images:["/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会.jpg","/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会-2.jpg","/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会-2.webp","/assets/memories/2015年04月30日-运校运动会，五班表演《we're all inthis together》，在下午举办四月生日会-3.jpg"]},
    {date:'2015.09.10',title:'教师颁奖典礼',description:'第一届教师颁奖典礼',images:['/assets/memories/2015年09月10日-第一节教师颁奖典礼.jpg','/assets/memories/2015年09月10日-第一节教师颁奖典礼-2.jpg']},
    {date:'2015.10.30',title:'每个月的生日会',description:'',images:['/assets/memories/2015年10月30日-十月生日会-1.jpg','/assets/memories/2015年10月30日-十月生日会-2.jpg','/assets/memories/2015年10月30日-十月生日会-3.jpg','/assets/memories/2015年10月30日-十月生日会-4.jpg','/assets/memories/2015年10月30日-十月生日会-5.jpg','/assets/memories/2015年10月30日-十月生日会-6.jpg']},
    {date:'2015.11.20',title:'小组歌唱与解散大会',description:'小组歌唱活动结束后，大家一起合唱《后来》。',images:['/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-9.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-2.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-3.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-4.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-5.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-6.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-7.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-8.jpg','/assets/memories/2015年11月20日-小组唱歌活动，暨解散大会 结束后大家合唱《后来》-1.jpg']},
    {date:'2015.12.25',title:'圣诞老人送苹果',description:'钟诚扮演圣诞老人，为大家送上苹果。',images:['/assets/memories/2015年12月25日-钟诚扮演圣诞老人送苹果-1.webp','/assets/memories/2015年12月25日-钟诚扮演圣诞老人送苹果-2.webp','/assets/memories/2015年12月25日-钟诚扮演圣诞老人送苹果-3.webp']},
  ]},
  {year:'2016',events:[
    {date:'2016.02.03',title:'全班逃课看电影',description:'一、二月生日会，全班逃课看《功夫熊猫》3',images:['/assets/memories/2016年02月03日-全班逃课看《功夫熊猫3》.jpg']},
    {date:'2016.06.07—08',title:'高考',description:'',images:['/assets/memories/2016年06月7日-8日-高考-1.jpg','/assets/memories/2016年06月7日-8日-高考-2.jpg','/assets/memories/2016年06月7日-8日-高考-3.jpg']},
    {date:'2016.06.21',title:'我们毕业啦！',description:'',images:['/assets/memories/2016年06月21日-我们毕业啦！-1.jpg','/assets/memories/2016年06月21日-我们毕业啦！-2.jpg','/assets/memories/2016年06月21日-我们毕业啦！-3.jpg']},
  ]},
  {year:'2026',events:[{date:'2026.10.5',title:'再聚',description:'毕业十年，五班再聚',images:['/images/reunion-postcard-10th.png']}]},
];
const MEMORY_ASSET_VERSION='b3710fcebe3d';
const assetUrl=(src:string)=>`${import.meta.env.BASE_URL}${src.replace(/^\/+/, '')}`;
const memoryNodes=timelineData.flatMap(group=>group.events.map(event=>({...event,year:group.year,type:'memory' as const,images:event.images.map(src=>`${assetUrl(src)}?v=${MEMORY_ASSET_VERSION}`)})));
const markerNodes=[
  {date:'2014.02.16',year:'2014',title:'迎来9位新同学',type:'marker' as const},
  {date:'2014.07.03',year:'2014',title:'高一结束',type:'marker' as const},
  {date:'2014.09.03',year:'2014',title:'新生物老师赵307登场',type:'marker' as const},
  {date:'2015.03.01',year:'2015',title:'8个小组分组成功',type:'marker' as const},
  {date:'2015.07.03',year:'2015',title:'高二结束',type:'marker' as const},
  {date:'2016.06.03',year:'2016',title:'给十年后的自己写一份信',type:'marker' as const},
];
const timelineSortKey=(date:string,year:string)=>year==='2026'?'2026.12.31':date.replaceAll('-','.').slice(0,10);
const railNodes=[...memoryNodes.map((node,memoryIndex)=>({...node,memoryIndex})),...markerNodes].sort((a,b)=>timelineSortKey(a.date,a.year).localeCompare(timelineSortKey(b.date,b.year)));
const memoryRailPositions=memoryNodes.map((_,memoryIndex)=>railNodes.findIndex(node=>node.type==='memory'&&node.memoryIndex===memoryIndex));
const timelineDateLabel=(date:string)=>date.match(/^\d{4}\.(.+)$/)?.[1]??'';
export default function Home() {
  const [page,setPage]=useState(0), [voteState,setVoteState]=useState<VoteUiState>('idle'), [selectedVote,setSelectedVote]=useState<Vote|null>(null), [results,setResults]=useState<VoteResults>(emptyVoteResults), [videoError,setVideoError]=useState(false), [activeNode,setActiveNode]=useState(0), [timelineDirection,setTimelineDirection]=useState<TimelineDirection>('forward'), [musicPlaying,setMusicPlaying]=useState(false), [photoPreview,setPhotoPreview]=useState<PhotoPreview|null>(null);
  const audioRef=useRef<HTMLAudioElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const videoPreloadStartedRef=useRef(false);
  const videoGesturePrimeStartedRef=useRef(false);
  const timelineWarmupStartedRef=useRef(false);
  const timelineWarmupTimerRef=useRef(0);
  const timelinePrefetchQueueRef=useRef<TimelinePrefetchTask[]>([]);
  const timelinePrefetchActiveRef=useRef(0);
  const timelinePrefetchKnownRef=useRef(new Set<string>());
  const timelinePrefetchDecodedRef=useRef(new Map<string,HTMLImageElement>());
  const timelinePrefetchTimerRef=useRef(0);
  const timelineDirectionRef=useRef<TimelineDirection>('forward');
  const activePageRef=useRef(0);
  const timelinePosition=useRef(0);
  const timelineAnimation=useRef<number|null>(null);
  const activeNodeRef=useRef(0);
  const photoPreviewOpenRef=useRef(false);
  const nativeSwipeHandled=useRef(false);
  const touch=useRef<{x:number;y:number;inTimeline:boolean;direction:'pending'|'horizontal'|'vertical';timelineLogged:boolean}>({x:0,y:0,inTimeline:false,direction:'pending',timelineLogged:false});
  const mouse=useRef({x:0,y:0,startTrackScroll:0,dragging:false,inTimeline:false});
  const wheelLocked=useRef(false);
  useEffect(()=>{const saved=localStorage.getItem(confirmedVoteStorageKey);const savedVote=saved==='attend'||saved==='absent'||saved==='maybe'?saved:null;getVoteResults().then(realResults=>{setResults(realResults);console.debug('results loaded',realResults);if(savedVote){setSelectedVote(savedVote);setVoteState('success')}}).catch(error=>{console.error('[votes] Failed to load CloudBase vote totals',error);setVoteState('error')})},[]);
  useEffect(()=>{console.debug('vote state change',voteState)},[voteState]);
  const videoState=(video:HTMLVideoElement)=>({readyState:video.readyState,networkState:video.networkState,paused:video.paused});
  const pumpTimelinePrefetch=()=>{while(timelinePrefetchActiveRef.current<3&&timelinePrefetchQueueRef.current.length){const task=timelinePrefetchQueueRef.current.shift();if(!task)break;timelinePrefetchActiveRef.current+=1;const image=new Image();image.decoding='async';image.fetchPriority=task.priority;const finish=()=>{timelinePrefetchActiveRef.current=Math.max(0,timelinePrefetchActiveRef.current-1);pumpTimelinePrefetch()};image.onload=()=>{void decodeImageForDisplay(image).then(()=>{timelinePrefetchDecodedRef.current.set(task.src,image);while(timelinePrefetchDecodedRef.current.size>24){const oldest=timelinePrefetchDecodedRef.current.keys().next().value as string|undefined;if(!oldest)break;timelinePrefetchDecodedRef.current.delete(oldest)}finish()})};image.onerror=()=>{timelinePrefetchKnownRef.current.delete(task.src);finish()};image.src=task.src}};
  const enqueueTimelineImages=(indices:number[],priority:'high'|'low')=>{const tasks=indices.flatMap(index=>memoryNodes[index]?.images??[]).filter(src=>!timelinePrefetchKnownRef.current.has(src)).map(src=>({src,priority}));for(const task of tasks)timelinePrefetchKnownRef.current.add(task.src);if(priority==='high')timelinePrefetchQueueRef.current.unshift(...tasks);else timelinePrefetchQueueRef.current.push(...tasks);pumpTimelinePrefetch()};
  const scheduleTimelinePrefetch=(index:number,direction:TimelineDirection,immediate=false)=>{const current=Math.max(0,Math.min(memoryNodes.length-1,index));enqueueTimelineImages([current],'high');window.clearTimeout(timelinePrefetchTimerRef.current);timelinePrefetchTimerRef.current=window.setTimeout(()=>{const ahead=Array.from({length:5},(_,offset)=>current+(direction==='forward'?offset+1:-(offset+1))),behind=Array.from({length:2},(_,offset)=>current+(direction==='forward'?-(offset+1):offset+1)),indices=[...ahead,...behind].filter(candidate=>candidate>=0&&candidate<memoryNodes.length);enqueueTimelineImages(indices,'low')},immediate?40:100)};
  const updateTimelineDirection=(direction:TimelineDirection)=>{if(timelineDirectionRef.current===direction)return;timelineDirectionRef.current=direction;setTimelineDirection(direction)};
  const startVideoPreload=(source:'click'|'swipe'|'navigation'|'page-enter')=>{const video=videoRef.current;if(!video||videoPreloadStartedRef.current)return;videoPreloadStartedRef.current=true;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','true');if(videoGesturePrimeStartedRef.current){console.debug(`[media] video preload covered by gesture prime source=${source}`,videoState(video));return}if(video.readyState<HTMLMediaElement.HAVE_CURRENT_DATA){console.debug(`[media] video preload start source=${source}`,videoState(video));video.load()}};
  const startTimelineWarmup=()=>{if(timelineWarmupStartedRef.current)return;timelineWarmupStartedRef.current=true;console.debug('[media] timeline warmup start: first two nodes');enqueueTimelineImages([0,1],'high')};
  const primeVideoOnTouchStart=()=>{const video=videoRef.current;if(!video||videoGesturePrimeStartedRef.current)return;videoGesturePrimeStartedRef.current=true;videoPreloadStartedRef.current=true;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','true');console.debug('[media] video touchstart prime',videoState(video));void video.play().then(()=>{console.debug('[media] video touchstart prime resolved',videoState(video));if(activePageRef.current!==1){video.pause();if(Number.isFinite(video.duration))video.currentTime=0}}).catch((error:unknown)=>{const detail=error instanceof DOMException?{name:error.name,message:error.message}:error;console.debug('[media] video touchstart prime rejected',detail,videoState(video));videoGesturePrimeStartedRef.current=false;videoPreloadStartedRef.current=false})};
  const prepareAndPlayVideoFromUserGesture=(source:'click'|'swipe'|'navigation')=>{const video=videoRef.current;if(!video)return;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','true');startVideoPreload(source);console.debug(`[media] video gesture play source=${source}`,videoState(video));void video.play().then(()=>console.debug(`[media] video gesture play resolved source=${source}`,videoState(video))).catch((error:unknown)=>{const detail=error instanceof DOMException?{name:error.name,message:error.message}:error;console.debug(`[media] video gesture play rejected source=${source}`,detail,videoState(video))})};
  const activateVideoPage=(source:'click'|'swipe'|'navigation'|'page-enter'|'media-ready')=>{const video=videoRef.current;if(!video)return;video.muted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','true');if(activePageRef.current!==1||video.readyState<HTMLMediaElement.HAVE_CURRENT_DATA)return;console.debug(`[media] video play start source=${source}`);void video.play().catch(()=>console.debug(`[media] video play blocked source=${source}`))};
  const tryPlayAudio=()=>{const audio=audioRef.current;if(!audio)return;void audio.play().then(()=>console.debug('audio play success')).catch(()=>{setMusicPlaying(false);console.debug('audio play blocked')})};
  const enterVideoPage=(source:'click'|'swipe'|'navigation')=>{console.debug(`enter page2 source=${source}`);activePageRef.current=1;prepareAndPlayVideoFromUserGesture(source);setPage(1);activateVideoPage(source);tryPlayAudio()};
  const goToPage=(i:number,source:'swipe'|'navigation'='navigation')=>{const next=Math.max(0,Math.min(3,i));if(next===1&&page!==1){enterVideoPage(source);return}activePageRef.current=next;setPage(next)};
  const onStart=(e:React.TouchEvent)=>{if(photoPreviewOpenRef.current)return;const target=e.target as Element,inTimeline=Boolean(target.closest('.memory-track,.memory-rail'));touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY,inTimeline,direction:'pending',timelineLogged:false};if(inTimeline)console.debug('timeline touchstart')};
  const onMove=(e:React.TouchEvent)=>{if(photoPreviewOpenRef.current)return;const dx=e.touches[0].clientX-touch.current.x,dy=e.touches[0].clientY-touch.current.y;if(touch.current.direction==='pending'&&Math.max(Math.abs(dx),Math.abs(dy))>8)touch.current.direction=Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical';if(touch.current.inTimeline&&touch.current.direction==='horizontal'&&!touch.current.timelineLogged){touch.current.timelineLogged=true;console.debug('timeline direction=horizontal')}};
  const onEnd=(e:React.TouchEvent)=>{if(photoPreviewOpenRef.current||nativeSwipeHandled.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y,direction=touch.current.direction==='pending'?(Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical'):touch.current.direction;if(touch.current.inTimeline)console.debug('timeline drag end');if(direction==='horizontal')return;if(Math.abs(dy)>40)goToPage(page+(dy<0?1:-1),'swipe')};
  const getTrack=()=>document.querySelector('.timeline-track') as HTMLDivElement|null;
  const getRail=()=>document.querySelector('.memory-rail') as HTMLDivElement|null;
  const scrollForPosition=(container:HTMLElement,selector:string,position:number)=>{const nodes=Array.from(container.querySelectorAll<HTMLElement>(selector));if(!nodes.length)return 0;const bounded=Math.max(0,Math.min(nodes.length-1,position)),lower=Math.floor(bounded),upper=Math.min(nodes.length-1,lower+1),fraction=bounded-lower;const center=(node:HTMLElement)=>node.offsetLeft+node.clientWidth/2-container.clientWidth/2;return center(nodes[lower])+(center(nodes[upper])-center(nodes[lower]))*fraction};
  const railPositionForMemoryPosition=(position:number)=>{const bounded=Math.max(0,Math.min(memoryNodes.length-1,position)),lower=Math.floor(bounded),upper=Math.min(memoryNodes.length-1,lower+1),fraction=bounded-lower;return memoryRailPositions[lower]+(memoryRailPositions[upper]-memoryRailPositions[lower])*fraction};
  const positionForTrackScroll=(scrollLeft:number)=>{const track=getTrack(),slides=track?Array.from(track.querySelectorAll<HTMLElement>('.memory-slide')):[];if(!track||!slides.length)return timelinePosition.current;const target=scrollLeft+track.clientWidth/2,centers=slides.map(slide=>slide.offsetLeft+slide.clientWidth/2);if(target<=centers[0])return 0;for(let index=0;index<centers.length-1;index++){if(target<=centers[index+1])return index+(target-centers[index])/(centers[index+1]-centers[index])}return centers.length-1};
  const renderTimelinePosition=(position:number)=>{const track=getTrack(),rail=getRail(),bounded=Math.max(0,Math.min(memoryNodes.length-1,position));timelinePosition.current=bounded;if(track)track.scrollLeft=scrollForPosition(track,'.memory-slide',bounded);if(rail)rail.scrollLeft=scrollForPosition(rail,'button',railPositionForMemoryPosition(bounded));const nearest=Math.round(bounded);if(nearest!==activeNodeRef.current){activeNodeRef.current=nearest;setActiveNode(nearest)}};
  const cancelTimelineAnimation=()=>{if(timelineAnimation.current!==null){cancelAnimationFrame(timelineAnimation.current);timelineAnimation.current=null}};
  const snapToIndex=(index:number)=>{cancelTimelineAnimation();const target=Math.max(0,Math.min(memoryNodes.length-1,index)),start=timelinePosition.current;if(Math.abs(target-start)<.001){renderTimelinePosition(target);return}const started=performance.now(),duration=420;const frame=(now:number)=>{const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);renderTimelinePosition(start+(target-start)*eased);if(progress<1)timelineAnimation.current=requestAnimationFrame(frame);else{timelineAnimation.current=null;renderTimelinePosition(target)}};timelineAnimation.current=requestAnimationFrame(frame)};
  const openPhotoPreview=(images:string[],selectedIndex:number,title:string)=>{cancelTimelineAnimation();photoPreviewOpenRef.current=true;touch.current={x:0,y:0,inTimeline:false,direction:'pending',timelineLogged:false};setPhotoPreview({images,selectedImage:images[selectedIndex],selectedIndex,title})};
  const closePhotoPreview=()=>{photoPreviewOpenRef.current=false;setPhotoPreview(null)};
  const onMouseDown=(e:React.MouseEvent)=>{if(photoPreviewOpenRef.current)return;const inTimeline=Boolean((e.target as Element).closest('.memory-track,.memory-rail'));if(inTimeline)cancelTimelineAnimation();mouse.current={x:e.clientX,y:e.clientY,startTrackScroll:getTrack()?.scrollLeft??0,dragging:true,inTimeline}};
  const onMouseMove=(e:React.MouseEvent)=>{if(photoPreviewOpenRef.current||!mouse.current.dragging||!mouse.current.inTimeline||page!==2)return;const dx=e.clientX-mouse.current.x,dy=e.clientY-mouse.current.y;if(Math.abs(dx)>Math.abs(dy)){updateTimelineDirection(dx<0?'forward':'backward');renderTimelinePosition(positionForTrackScroll(mouse.current.startTrackScroll-dx))}};
  const onMouseUp=(e:React.MouseEvent)=>{if(photoPreviewOpenRef.current||!mouse.current.dragging)return;mouse.current.dragging=false;const dx=e.clientX-mouse.current.x,dy=e.clientY-mouse.current.y;if(mouse.current.inTimeline&&Math.abs(dx)>Math.abs(dy)){snapToIndex(Math.round(timelinePosition.current));return}if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>48)goToPage(page+(dy<0?1:-1))};
  const onWheel=(e:React.WheelEvent)=>{if(photoPreviewOpenRef.current||wheelLocked.current||Math.abs(e.deltaY)<30)return;wheelLocked.current=true;goToPage(page+(e.deltaY>0?1:-1));window.setTimeout(()=>{wheelLocked.current=false},760)};
  const selectNode=(index:number)=>{updateTimelineDirection(index>=activeNodeRef.current?'forward':'backward');snapToIndex(index)};
  useEffect(()=>{
    const elements=Array.from(document.querySelectorAll<HTMLElement>('.memory-track,.memory-rail'));
    const cleanups=elements.map(element=>{
      let startX=0,startY=0,startTrackScroll=0,direction:'pending'|'horizontal'|'vertical'='pending';
      const start=(event:TouchEvent)=>{
        if(photoPreviewOpenRef.current)return;
        const point=event.touches[0];if(!point)return;
        cancelTimelineAnimation();
        startX=point.clientX;startY=point.clientY;startTrackScroll=getTrack()?.scrollLeft??0;direction='pending';
        getTrack()?.classList.add('is-dragging');getRail()?.classList.add('is-dragging');
        console.debug('timeline touchstart');
      };
      const move=(event:TouchEvent)=>{
        if(photoPreviewOpenRef.current)return;
        const point=event.touches[0];if(!point)return;
        const dx=point.clientX-startX,dy=point.clientY-startY;
        if(direction==='pending'&&Math.max(Math.abs(dx),Math.abs(dy))>8){direction=Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical';console.debug(`timeline direction=${direction}`)}
        if(direction!=='horizontal')return;
        event.preventDefault();
        updateTimelineDirection(dx<0?'forward':'backward');
        renderTimelinePosition(positionForTrackScroll(startTrackScroll-dx));
      };
      const end=()=>{
        if(photoPreviewOpenRef.current){getTrack()?.classList.remove('is-dragging');getRail()?.classList.remove('is-dragging');return}
        if(direction==='horizontal')console.debug('timeline drag end');
        getTrack()?.classList.remove('is-dragging');getRail()?.classList.remove('is-dragging');
        if(direction==='horizontal')snapToIndex(Math.round(timelinePosition.current));
      };
      element.addEventListener('touchstart',start,{passive:true});
      element.addEventListener('touchmove',move,{passive:false});
      element.addEventListener('touchend',end,{passive:true});
      element.addEventListener('touchcancel',end,{passive:true});
      return()=>{element.removeEventListener('touchstart',start);element.removeEventListener('touchmove',move);element.removeEventListener('touchend',end);element.removeEventListener('touchcancel',end)};
    });
    return()=>{cancelTimelineAnimation();cleanups.forEach(cleanup=>cleanup())};
  },[]);
  useEffect(()=>{const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),cover=document.querySelector<HTMLElement>('.cover');if(!isIOS||!cover)return;let startX=0,startY=0;const start=(event:TouchEvent)=>{const point=event.touches[0];if(!point)return;startX=point.clientX;startY=point.clientY;primeVideoOnTouchStart()};const end=(event:TouchEvent)=>{const point=event.changedTouches[0];if(!point)return;const dx=point.clientX-startX,dy=point.clientY-startY;if(dy>=-40||Math.abs(dy)<=Math.abs(dx))return;nativeSwipeHandled.current=true;const video=videoRef.current;if(video)video.classList.add('is-handoff');enterVideoPage('swipe');window.setTimeout(()=>{nativeSwipeHandled.current=false;video?.classList.remove('is-handoff')},0)};cover.addEventListener('touchstart',start,{passive:true});cover.addEventListener('touchend',end,{passive:true});return()=>{cover.removeEventListener('touchstart',start);cover.removeEventListener('touchend',end)}},[]);
  const playMusic=()=>tryPlayAudio();
  const toggleMusic=()=>{const audio=audioRef.current;if(!audio)return;if(audio.paused)playMusic();else audio.pause()};
  useEffect(()=>{activePageRef.current=page;const video=videoRef.current;if(!video)return;if(page===1){startVideoPreload('page-enter');activateVideoPage('page-enter');if(video.readyState>=HTMLMediaElement.HAVE_FUTURE_DATA)startTimelineWarmup()}else{video.pause();if(page===0)video.currentTime=0}if(page===2)console.debug('currentPage=2 timeline enabled=true')},[page]);
  useEffect(()=>{if(page!==2){if(page===3)timelinePrefetchQueueRef.current=[];return}scheduleTimelinePrefetch(activeNode,timelineDirection,true)},[page,activeNode,timelineDirection]);
  useEffect(()=>()=>{window.clearTimeout(timelineWarmupTimerRef.current);window.clearTimeout(timelinePrefetchTimerRef.current);timelinePrefetchQueueRef.current=[];timelinePrefetchDecodedRef.current.clear()},[]);
  const openInvitation=()=>enterVideoPage('click');
  const castVote=async(v:Vote)=>{if(voteState==='submitting')return;console.debug('vote click',v);setSelectedVote(v);setVoteState('submitting');console.debug('submit start',v);try{const realResults=await submitVote(v);setResults(realResults);localStorage.setItem(confirmedVoteStorageKey,v);setVoteState('success');console.debug('submit success',v,realResults)}catch(error){console.error('submit error',v,error);setVoteState('error')}};
  const modifyVote=()=>{localStorage.removeItem(confirmedVoteStorageKey);setSelectedVote(null);setVoteState('idle')};
  return <main className={`h5 page-${page}`} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
    <audio ref={audioRef} src={assetUrl('/assets/bgm.mp3')} loop preload="metadata" onPlay={()=>setMusicPlaying(true)} onPause={()=>setMusicPlaying(false)}/>
    <div className="video-media-layer"><video ref={videoRef} className={`invite-opening-video ${page===1?'is-page-video':''}`} src={assetUrl('/assets/invite-opening-8.mp4')} preload="metadata" autoPlay={page===1} playsInline {...{'webkit-playsinline':'true'}} muted disablePictureInPicture controlsList="nodownload noplaybackrate nofullscreen" onCanPlay={()=>{console.debug('[media] video canplay');if(activePageRef.current===1){startTimelineWarmup();activateVideoPage('media-ready')}}} onLoadedData={()=>{if(page===1){startTimelineWarmup();activateVideoPage('media-ready')}}} onPlaying={()=>{if(activePageRef.current===1)startTimelineWarmup()}} onEnded={e=>{const video=e.currentTarget;video.pause();if(Number.isFinite(video.duration))video.currentTime=Math.max(0,video.duration-.08)}} onError={()=>setVideoError(true)}/>{page===1&&<SwipeHint text="上滑回到当年" className="video-swipe-overlay"/>}</div>
    <button className={`music-control ${musicPlaying?'is-playing':''}`} type="button" aria-label={musicPlaying?'暂停背景音乐':'播放背景音乐'} aria-pressed={musicPlaying} onClick={toggleMusic}><span>♫</span></button>
    <div className="pages" style={{transform:`translate3d(0,-${page*25}%,0)`}}>
      <section className="page cover" aria-label="聚会邀请"><div className="grain"/><p className="eyebrow">CLASS FIVE · REUNION</p><div className="title-lockup"><p>高2013级5班</p><img className="reunion-title-art" src={assetUrl('/assets/reunion-title.png')} alt="十周年聚会"/><span>2016 — 2026</span></div><button className="invitation-cta" onClick={openInvitation} aria-label="点击开启邀请"><span className="badge-orbit"><img src={assetUrl('/assets/class-badge.png')} alt="高2013级5班班徽"/></span><b>点击开启</b><small>ENTER THE REUNION</small></button></section>
      <section className="page video-page" aria-label="青春影像"><div className={`video-fallback ${videoError?'visible':''}`}><div className="film-number">02</div><p>那年今日</p><h2>影像暂不可用</h2><span>请稍后重试或继续上滑浏览</span></div><div className="video-vignette"/><div className="page-label"><span>02</span> 青春影像</div></section>
      <section className="page timeline-page" aria-label="高中回忆时间轴"><header className="timeline-head"><p>03 · MEMORY LANE</p><h2>我们的高中时光</h2><span>左右滑动，重走 2013—2016</span></header><div className="memory-rail" aria-label="时间轴节点">{railNodes.map(node=><button type="button" key={`${node.date}-${node.title}`} className={node.type==='marker'?'marker':activeNode===node.memoryIndex?'active':''} onClick={()=>{if(node.type==='memory')selectNode(node.memoryIndex)}} aria-label={node.type==='marker'?`${timelineDateLabel(node.date)} ${node.title}，历史标记`:`${timelineDateLabel(node.date)} ${node.title}`}><span>{node.year}</span><i/><small>{timelineDateLabel(node.date)}</small>{node.type==='marker'&&<em>{node.title}</em>}</button>)}</div><div className="timeline-track memory-track">{memoryNodes.map((node,index)=>{const insideDirectionalWindow=timelineDirection==='forward'?index>=activeNode-2&&index<=activeNode+5:index>=activeNode-5&&index<=activeNode+2;return <article className={`memory-slide ${activeNode===index?'is-active':''}`} key={`${node.date}-${node.title}`}><div className="memory-copy"><h3>{node.title}</h3><p>{node.description}</p></div><MemoryPhotoStack images={node.images} title={node.title} year={node.year} tone={index%4} shouldLoad={page===2&&insideDirectionalWindow} priority={index<=1||index===activeNode} frameless={node.title==='再聚'} onOpen={photoIndex=>openPhotoPreview(node.images,photoIndex,node.title)}/></article>})}</div><div className="timeline-counter"><span>{String(activeNode+1).padStart(2,'0')}</span><i/> {String(memoryNodes.length).padStart(2,'0')}</div><SwipeHint text="上滑赴约"/></section>
      <section className="page vote-page" aria-label="聚会投票">{voteState!=='success'?<div className="vote-panel"><h2>十年之后，<br/>你会来吗？</h2><p className="subtitle">2026，我们再聚一次。</p><div className="choices"><VoteButton code="A" title="算我一个，风雨无阻" selected={selectedVote==='attend'} disabled={voteState==='submitting'} onClick={()=>castVote('attend')}/><VoteButton code="B" title="虽然很想来，但实在排不开，心与你们同在" selected={selectedVote==='absent'} disabled={voteState==='submitting'} onClick={()=>castVote('absent')}/><VoteButton code="C" title="先观望~还不确定，晚点给准信" selected={selectedVote==='maybe'} disabled={voteState==='submitting'} onClick={()=>castVote('maybe')}/></div><p className="vote-loading" role="status" aria-live="polite">{voteState==='submitting'?'正在收好你的回答…':voteState==='error'?'提交失败，请检查网络后重试':'点击选项即完成投票 · 同一设备可修改'}</p></div>:<div className="success"><div className="success-message"><p className="success-index">2016 · 2026</p><h2>收到！</h2><div className="success-copy"><p>十年以前，<br/>我们在毕业照里站在一起。</p><p>十年以后，<br/>希望这一次，我们还能再见。</p></div><p className="success-ending">期待再次见面</p></div><div className="result-footer"><p className="result-kicker">已有</p><div className="result-grid"><div><strong>{results.absent}</strong><span>人<br/>遗憾缺席</span></div><i/><div><strong>{results.attend}</strong><span>人<br/>确认参加</span></div><i/><div><strong>{results.maybe}</strong><span>人<br/>还不确定</span></div></div><button onClick={modifyVote}>修改选择</button></div></div>}</section>
    </div><nav className="dots" aria-label="页面导航">{[0,1,2,3].map(i=><button key={i} className={page===i?'active':''} onClick={()=>goToPage(i)} aria-label={`前往第${i+1}页`}/>)}</nav><PhotoLightbox preview={photoPreview} onClose={closePhotoPreview}/>
  </main>;
}
function SwipeHint({text,className='' }:{text:string;className?:string}){return <div className={`swipe-hint ${className}`}><span>↑</span><small>{text}</small></div>}
function VoteButton({code,title,selected,disabled,onClick}:{code:string,title:string,selected:boolean,disabled:boolean,onClick:()=>void}){return <button className={selected?'is-selected':''} disabled={disabled} onClick={onClick}><span>{code}</span><b>{title}</b></button>}
