import { atom as atomSignia, computed as computedSignia } from 'signia'

export function get(key, ctx='store'){
  if (!globalThis[ctx]){
    globalThis[ctx] = {}
  }
  // console.log(globalThis[ctx][key])
  return globalThis[ctx][key]
}
export function setSingle(key, atom, ctx: string='store'){
  if (!globalThis[ctx]){
    globalThis[ctx] = {}
  }
  globalThis[ctx][key] = atom
  return globalThis[ctx][key]
}
export function set(key, atom, ctxs:string|string[]='store'){
  if (!Array.isArray(ctxs)){
    ctxs = [ctxs]
  }
  ctxs.forEach(ctx=>setSingle(key, atom, ctx))
}
export function atom(key, value, ctxs: string|string[]='store') {  
  let atomS = atomSignia(key, value)
  set(key, atomS, ctxs)  
  return atomS
}
const subsAll = (stringFunc, transformMatch)=>{
  let regex = /\b\w+(?=\s*\.\s*value\b)/g
  let matches = stringFunc.match(regex)
    // console.log(matches)
  for (let match of matches){
    let new_reg = new RegExp(`${match}\.value`)
    let new_value = transformMatch(match)//`globalThis[${match}].value`
    if (new_value!=null){
      stringFunc = stringFunc.replace(new_reg, new_value)
    }
  }
  return stringFunc
}
function getSelectedCtx(key,ctxs=[]){
  if (!Array.isArray(ctxs)){
     ctxs = [ctxs]
    }
  let filtered = ctxs.filter(ctx=>globalThis[ctx] && globalThis[ctx][key])
  if (filtered.length>0){
    if (filtered.length>1) console.log('STORE', 'multiple context found', key)
    const selectedCtx = filtered[filtered.length-1]
    return selectedCtx
  }else{
    console.log('STORE', 'no context found', key)
  }
  return null
}
const getArgs = (func)=>{
  let str = func.toString();
  let args = /\(\s*([^)]+?)\s*\)/.exec(str);
  if (args && args[1]) {
    return args[1].split(/\s*,\s*/);
  }
  return []
}
// type a = Parameters<typeof computedSignia<any,any>>
export function computed<T,K>(key, func, ctxs=['store'], ctxWrite: string|string[]="store", aliases={},specificContexts={}, ) {
  const transformMatch = (match)=>{
    if (aliases[match]){
      match = aliases[match]
    }
    let specific = specificContexts[match]    
    let selectedCtx = specific?specific:getSelectedCtx(match, ctxs)
    if (selectedCtx!=null){
      return globalThis[selectedCtx][match]
    }
    return null
  }
  // let args = getArgs(func)
  // let values = args.map(transformMatch)
  let newFunc = ()=>{
    const getter = (m)=>transformMatch(m)?.value
    return func(getter)
  }
  let atomComputed = computedSignia<T,K>(key, newFunc)
  set(key, atomComputed, ctxWrite)
  return atomComputed
}
export function getAtoms(keys, ctxs=['store']){
  if (!Array.isArray(keys)) keys = [keys]
  if (!Array.isArray(ctxs)) ctxs = [ctxs]
  return Object.fromEntries(keys.map(key=>{
    const selectedCtx = getSelectedCtx(key, ctxs)
    const atom = get(key, selectedCtx)
    return [`${key}Atom`, atom]
  }))
}