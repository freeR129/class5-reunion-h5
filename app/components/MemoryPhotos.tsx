'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

export type PhotoPreview = {
  images: string[];
  selectedImage: string;
  selectedIndex: number;
  title: string;
};

type PhotoLayout = { x:number; y:number; width:number; height:number; rotation:number; zIndex:number };

const layouts:Record<number,PhotoLayout[]> = {
  1:[{x:8,y:3,width:84,height:94,rotation:-.5,zIndex:1}],
  2:[{x:3,y:3,width:55,height:68,rotation:-2,zIndex:1},{x:42,y:29,width:55,height:68,rotation:1.7,zIndex:2}],
  3:[{x:23,y:0,width:54,height:58,rotation:-1,zIndex:1},{x:1,y:42,width:52,height:58,rotation:2.2,zIndex:2},{x:47,y:40,width:52,height:58,rotation:-1.8,zIndex:3}],
  4:[{x:1,y:1,width:48,height:52,rotation:-2.2,zIndex:1},{x:51,y:0,width:48,height:52,rotation:1.5,zIndex:2},{x:8,y:48,width:48,height:52,rotation:1.8,zIndex:3},{x:52,y:47,width:48,height:52,rotation:-1.4,zIndex:4}],
};

const denseLayout:PhotoLayout[] = [
  {x:0,y:2,width:34,height:36,rotation:-2.4,zIndex:1},
  {x:33,y:0,width:34,height:36,rotation:1.2,zIndex:2},
  {x:66,y:3,width:34,height:36,rotation:-1.3,zIndex:3},
  {x:5,y:33,width:34,height:36,rotation:1.7,zIndex:4},
  {x:36,y:31,width:34,height:36,rotation:-1.8,zIndex:5},
  {x:65,y:34,width:34,height:36,rotation:2.1,zIndex:6},
  {x:0,y:64,width:34,height:36,rotation:-1.2,zIndex:7},
  {x:33,y:62,width:34,height:36,rotation:2.4,zIndex:8},
  {x:66,y:64,width:34,height:36,rotation:-2,zIndex:9},
];

const sixPhotoGrid:PhotoLayout[] = [
  {x:1,y:0,width:52,height:38,rotation:-2.1,zIndex:1},
  {x:48,y:2,width:52,height:38,rotation:1.6,zIndex:2},
  {x:3,y:31,width:52,height:38,rotation:1.4,zIndex:4},
  {x:47,y:30,width:52,height:38,rotation:-1.9,zIndex:3},
  {x:0,y:62,width:52,height:38,rotation:-1.5,zIndex:5},
  {x:49,y:61,width:52,height:38,rotation:2,zIndex:6},
];

function getLayout(count:number,index:number):PhotoLayout {
  if(count<=4)return layouts[count][index];
  if(count===6)return sixPhotoGrid[index];
  return denseLayout[index%denseLayout.length];
}

export function MemoryPhotoStack({images,title,year,tone,shouldLoad,priority,onOpen}:{images:string[];title:string;year:string;tone:number;shouldLoad:boolean;priority:boolean;onOpen:(index:number)=>void}) {
  if(!images.length)return <div className={`memory-photo memory-photo-placeholder tone-${tone}`}><div className="photo-glow"/><b>{year}</b></div>;
  return <div className={`memory-photo memory-photo-stack photo-count-${Math.min(images.length,6)}`} role="group" aria-label={`${title}照片，共${images.length}张`}>
    {images.map((src,index)=><MemoryPhotoCard key={src} src={src} alt={`${title}照片 ${index+1}`} layout={getLayout(images.length,index)} shouldLoad={shouldLoad} priority={priority} onOpen={()=>onOpen(index)}/>) }
  </div>;
}

function MemoryPhotoCard({src,alt,layout,shouldLoad,priority,onOpen}:{src:string;alt:string;layout:PhotoLayout;shouldLoad:boolean;priority:boolean;onOpen:()=>void}) {
  const [loaded,setLoaded]=useState(false);
  const [failed,setFailed]=useState(false);
  const [retryCount,setRetryCount]=useState(0);
  const [requestVersion,setRequestVersion]=useState(0);
  const retryTimer=useRef(0);
  const wasLoadable=useRef(shouldLoad);
  const pointer=useRef({x:0,y:0,moved:false});
  useEffect(()=>()=>window.clearTimeout(retryTimer.current),[]);
  useEffect(()=>{
    window.clearTimeout(retryTimer.current);
    if(shouldLoad&&!wasLoadable.current&&failed){
      setFailed(false);
      setLoaded(false);
      setRetryCount(0);
      setRequestVersion(version=>version+1);
    }
    wasLoadable.current=shouldLoad;
  },[shouldLoad,failed]);
  const style={
    '--photo-x':`${layout.x}%`,
    '--photo-y':`${layout.y}%`,
    '--photo-width':`${layout.width}%`,
    '--photo-height':`${layout.height}%`,
    '--photo-rotation':`${layout.rotation}deg`,
    '--photo-z':layout.zIndex,
  } as CSSProperties;
  const retrySrc=requestVersion===0?src:`${src}${src.includes('?')?'&':'?'}retry=${requestVersion}`;
  const handleError=()=>{
    setLoaded(false);
    if(retryCount>=2){
      setFailed(true);
      console.warn(`Memory photo failed after retries: ${src}`);
      return;
    }
    const nextRetry=retryCount+1;
    const delay=nextRetry===1?500:1500;
    window.clearTimeout(retryTimer.current);
    retryTimer.current=window.setTimeout(()=>{
      setRetryCount(nextRetry);
      setRequestVersion(version=>version+1);
    },delay);
  };
  const onPointerDown=(event:PointerEvent<HTMLButtonElement>)=>{pointer.current={x:event.clientX,y:event.clientY,moved:false};event.currentTarget.setPointerCapture?.(event.pointerId)};
  const onPointerMove=(event:PointerEvent<HTMLButtonElement>)=>{if(Math.hypot(event.clientX-pointer.current.x,event.clientY-pointer.current.y)>9)pointer.current.moved=true};
  const onPointerCancel=()=>{pointer.current.moved=true};
  return <button className={`memory-photo-card ${loaded?'is-loaded':''} ${failed?'is-failed':''}`} type="button" style={style} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerCancel={onPointerCancel} onClick={event=>{event.stopPropagation();if(pointer.current.moved){event.preventDefault();return}onOpen()}} aria-label={`放大查看${alt}`}>
    {shouldLoad&&!failed&&<img src={retrySrc} alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'low'} draggable={false} onLoad={()=>{setLoaded(true);setFailed(false)}} onError={handleError}/>} 
    {(!shouldLoad||!loaded||failed)&&<span className="memory-photo-loading" aria-hidden="true"/>}
  </button>;
}

export function PhotoLightbox({preview,onClose}:{preview:PhotoPreview|null;onClose:()=>void}) {
  const [closing,setClosing]=useState(false);
  const closeTimer=useRef(0);
  useEffect(()=>{setClosing(false)},[preview]);
  useEffect(()=>()=>window.clearTimeout(closeTimer.current),[]);
  const requestClose=()=>{if(closing)return;setClosing(true);closeTimer.current=window.setTimeout(onClose,220)};
  useEffect(()=>{if(!preview)return;const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')requestClose()};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[preview,closing]);
  if(!preview)return null;
  return <div className={`photo-lightbox ${closing?'is-closing':''}`} role="dialog" aria-modal="true" aria-label={`${preview.title}大图预览`} onClick={event=>{event.stopPropagation();if(event.target===event.currentTarget)requestClose()}} onTouchStart={event=>event.stopPropagation()} onTouchMove={event=>{event.stopPropagation();event.preventDefault()}} onTouchEnd={event=>event.stopPropagation()}>
    <button className="photo-lightbox-close" type="button" aria-label="关闭照片预览" onClick={event=>{event.stopPropagation();requestClose()}}>×</button>
    <img className="photo-lightbox-image" src={preview.selectedImage} alt={`${preview.title}照片 ${preview.selectedIndex+1}`}/>
  </div>;
}
