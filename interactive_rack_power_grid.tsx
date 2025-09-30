"use client";

// Single-file, self-contained preview (no external UI imports)
// - Includes lightweight Card/Input/Button/Slider/ScrollArea components
// - Uses lucide-react for icons (available in preview); if it fails, swap icons for plain text

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { PlugZap, Cpu, Gauge, Database, HardDrive, Plus, Minus, Trash2, Info } from "lucide-react";

/*********************************
 * Minimal UI primitives
 *********************************/
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={"rounded-2xl border bg-white "+(props.className||"")} />;
}
function CardHeader(props: React.HTMLAttributes<HTMLDivElement>){
  return <div {...props} className={"px-4 pt-4 "+(props.className||"")} />;
}
function CardContent(props: React.HTMLAttributes<HTMLDivElement>){
  return <div {...props} className={"px-4 pb-4 "+(props.className||"")} />;
}
function CardTitle({children}:{children:React.ReactNode}){ return <h3 className="text-lg font-semibold">{children}</h3>; }
function Button({children,onClick,disabled,className}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;className?:string;}){
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-sm ${disabled?"opacity-50 cursor-not-allowed":"hover:bg-gray-50"} ${className||""}`}>{children}</button>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={`border rounded-xl px-2 py-1 ${props.className||""}`} />;
}
function Slider({value,min,max,step,onValueChange}:{value:[number];min:number;max:number;step?:number;onValueChange:(v:[number])=>void;}){
  const [v,setV]=useState(value[0]);
  return (
    <input type="range" min={min} max={max} step={step||1} value={v}
      onChange={(e)=>{ const n=Number(e.target.value); setV(n); onValueChange([n]); }}
      className="w-full" />
  );
}
function ScrollArea({className,children}:{className?:string;children:React.ReactNode}){
  return <div className={`overflow-auto ${className||""}`}>{children}</div>;
}

/*********************************
 * Specs-driven mappings
 *********************************/
const POWER_W: Record<string, number> = {
  "Intel Control Plane Node": 249,
  "Intel Admin Node": 249,
  "AMD Control Plane Node": 348,
  "AMD Admin Node": 348,
  "Edge Switch": 150,
  "Edge Firewall": 450,
  "Core Switch": 973,
  "Mgmt Switch": 130,
  "POE Switch": 920,
  "Intel Compute Node": 658,
  "AMD Compute Node": 584,
  "Intel L40 Node": 0,
  "Intel H100 Node": 5888,
  "Intel L40s Node": 1600,
  "VAST C-Box": 2300,
  "VAST D-Box": 850,
  "Vast Switch": 150,
  "Cradlepoint SDWAN": 24,
  "Pepwave MAX Transit": 18,
  "Pepwave MAX BR2": 25,
  "KVM": 60,
  "Rack Power": 0,
  "VCPU": 0,
  "Blanking Plate": 0,
  "sscc140": 650,
};

type DeviceSpec = {
  cores:number; sockets:number; threads:number; gpus:number; ramGB:number; bootGB:number; localTB:number; ru:number; powerW:number; btu:number; weightLb:number; listPrice:number; armadaPrice:number;
  gpuModel?: string; gpuCountPerNode?: number; info?: string; manufacturer?: string; sku?: string; acVolts?: string; acAmps?: number;
};

const SPEC_ATTRS: Record<string, DeviceSpec> = {
  "Intel Control Plane Node": {cores:16,sockets:1,threads:32,gpus:0,ramGB:64,bootGB:480,localTB:3.84,ru:1,powerW:249,btu:849.623267,weightLb:41,listPrice:25721,armadaPrice:7887.68, manufacturer:"Intel", info:"Handles orchestration and control plane tasks, coordinating cluster operations."},
  "Intel Admin Node": {cores:16,sockets:1,threads:16,gpus:0,ramGB:64,bootGB:480,localTB:3.84,ru:1,powerW:249,btu:849.623267,weightLb:41,listPrice:49.6,armadaPrice:7395, manufacturer:"Intel", info:"Provides system administration and management services."},
  "AMD Control Plane Node": {cores:16,sockets:1,threads:16,gpus:0,ramGB:64,bootGB:480,localTB:3.84,ru:1,powerW:348,btu:1187.425288,weightLb:44.5,listPrice:100000,armadaPrice:100000, manufacturer:"AMD", info:"Runs control plane workloads on AMD architecture for cluster coordination."},
  "AMD Admin Node": {cores:16,sockets:1,threads:16,gpus:0,ramGB:64,bootGB:480,localTB:3.84,ru:1,powerW:348,btu:1187.425288,weightLb:44.5,listPrice:100000,armadaPrice:100000, manufacturer:"AMD", info:"Provides administration and support utilities on AMD platform."},
  "Edge Switch": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:150,btu:511.821245,weightLb:23.8,listPrice:50000,armadaPrice:17875, info:"Network switch that connects edge devices to the core."},
  "Edge Firewall": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:450,btu:1535,weightLb:15.9,listPrice:46352,armadaPrice:20693, info:"Provides security by filtering and monitoring edge traffic."},
  "Core Switch": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:973,btu:3322,weightLb:10.27,listPrice:16945,armadaPrice:5154, info:"High-throughput switch aggregating traffic in the core network."},
  "Mgmt Switch": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:130,btu:443,weightLb:10.41,listPrice:10000,armadaPrice:3831.81, info:"Dedicated switch for management network traffic."},
  "POE Switch": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:920,btu:3138,weightLb:0,listPrice:0,armadaPrice:0, info:"Distributes Power-over-Ethernet for access devices."},
  "Intel Compute Node": {cores:64,sockets:2,threads:128,gpus:0,ramGB:512,bootGB:960,localTB:15.36,ru:2,powerW:658,btu:2245,weightLb:95.6,listPrice:126612,armadaPrice:36400, manufacturer:"Intel", info:"Provides general purpose compute resources for workloads."},
  "AMD Compute Node": {cores:32,sockets:2,threads:64,gpus:0,ramGB:256,bootGB:480,localTB:11.52,ru:1,powerW:584,btu:1992.69,weightLb:41,listPrice:100000,armadaPrice:100000, manufacturer:"Dell R655", info:"AMD EPYC-based compute node optimized for performance and efficiency."},
  "Intel H100 Node": {cores:96,sockets:2,threads:192,gpus:4,ramGB:512,bootGB:1920,localTB:30.72,ru:4,powerW:5888,btu:20096,weightLb:150,listPrice:600000,armadaPrice:1062000, gpuModel:"NVIDIA H100", gpuCountPerNode:4, info:"Accelerates AI and HPC workloads with 4x NVIDIA H100 GPUs."},
  "Intel L40 Node": {cores:64,sockets:2,threads:128,gpus:2,ramGB:512,bootGB:1920,localTB:30.72,ru:4,powerW:1600,btu:5456,weightLb:120,listPrice:0,armadaPrice:0, gpuModel:"NVIDIA L40", gpuCountPerNode:2, info:"Handles graphics and AI inference with 2x NVIDIA L40 GPUs."},
  "Intel L40s Node": {cores:64,sockets:2,threads:128,gpus:4,ramGB:512,bootGB:1920,localTB:30.72,ru:4,powerW:1600,btu:5456,weightLb:120,listPrice:0,armadaPrice:0, gpuModel:"NVIDIA L40s", gpuCountPerNode:4, info:"Provides accelerated compute with 4x NVIDIA L40s GPUs."},
  "VAST C-Box": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:4,powerW:2300,btu:7846,weightLb:0,listPrice:0,armadaPrice:0, info:"Metadata and services node in the VAST storage system."},
  "VAST D-Box": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:550,ru:4,powerW:850,btu:2900,weightLb:0,listPrice:0,armadaPrice:0, info:"Capacity node for VAST storage system."},
  "Vast Switch": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:150,btu:511.8,weightLb:0,listPrice:0,armadaPrice:0, info:"Provides fabric connectivity within VAST clusters."},
  "KVM": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:60,btu:205,weightLb:0,listPrice:0,armadaPrice:0, info:"Allows local console access (Keyboard/Video/Mouse)."},
  "Blanking Plate": {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:1,powerW:0,btu:0,weightLb:0,listPrice:0,armadaPrice:0, info:"Fills empty rack slots to ensure proper airflow."},
  "sscc140": {cores:32,sockets:2,threads:64,gpus:0,ramGB:512,bootGB:480,localTB:20,ru:2,powerW:650,btu:2200,weightLb:60,listPrice:45000,armadaPrice:30000, manufacturer:"SSCC", info:"Experimental balanced compute node combining moderate core counts with large memory for mixed workloads.", acVolts:"100-240 VAC", acAmps:3.0},
};

/*********************************
 * Categorization & Colors
 *********************************/
const DEVICE_GROUPS: Record<string,string[]> = {
  Network: ["Edge Switch","Edge Firewall","Core Switch","Mgmt Switch","POE Switch","Vast Switch","Cradlepoint SDWAN","Pepwave MAX Transit","Pepwave MAX BR2"],
  "GPU Compute": ["Intel H100 Node","Intel L40 Node","Intel L40s Node"],
  "CPU Compute": ["Intel Compute Node","AMD Compute Node","sscc140"],
  Storage: ["VAST C-Box","VAST D-Box"],
  "Control/KVM": ["Intel Control Plane Node","Intel Admin Node","AMD Control Plane Node","AMD Admin Node","KVM"],
  Misc: ["Rack Power","VCPU","Blanking Plate"],
};

const CATEGORY_COLORS: Record<string,string> = {
  Network: "bg-blue-100 text-blue-800",
  "GPU Compute": "bg-purple-100 text-purple-800",
  "CPU Compute": "bg-amber-100 text-amber-800",
  Storage: "bg-green-100 text-green-800",
  "Control/KVM": "bg-pink-100 text-pink-800",
  Misc: "bg-gray-100 text-gray-800",
};

const CATEGORY_OF: Record<string,string> = Object.entries(DEVICE_GROUPS).reduce((acc,[cat,items])=>{
  items.forEach(d=> acc[d]=cat);
  return acc;
},{} as Record<string,string>);

/*********************************
 * Helpers
 *********************************/
function Metric({ icon, label, value, warn = false }:{ icon: React.ReactNode; label:string; value:number|string; warn?:boolean }){
  return (
    <div className={`px-3 py-2 rounded-xl ${warn?"bg-red-50":"bg-gray-100"}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      </div>
      <div className="text-sm font-semibold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}

function CatBadge({ name }:{ name:string }){
  const cat = CATEGORY_OF[name] || "Misc";
  const cls = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Misc;
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{cat}</span>;
}

function summarize(counts: Record<string, number>) {
  return Object.entries(counts).reduce((acc, [dev, qty]) => {
    const a = SPEC_ATTRS[dev] || {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:0,powerW:POWER_W[dev]||0,btu:0,weightLb:0,listPrice:0,armadaPrice:0};
    acc.cores += a.cores*qty; acc.sockets += a.sockets*qty; acc.threads += a.threads*qty; acc.gpus += a.gpus*qty;
    acc.ramGB += a.ramGB*qty; acc.bootGB += a.bootGB*qty; acc.localTB += a.localTB*qty; acc.ru += a.ru*qty;
    acc.powerW += (a.powerW||POWER_W[dev]||0)*qty; acc.btu += a.btu*qty; acc.weightLb += a.weightLb*qty;
    acc.listPrice += a.listPrice*qty; acc.armadaPrice += a.armadaPrice*qty;
    return acc;
  }, {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:0,powerW:0,btu:0,weightLb:0,listPrice:0,armadaPrice:0});
}

function formatPct(n:number){
  if(!isFinite(n)) return "0.0%";
  return `${n.toFixed(1)}%`;
}

function gpuBreakdown(counts: Record<string, number>){
  const agg: Record<string, {nodes:number; gpus:number}> = {};
  for(const [dev, qty] of Object.entries(counts)){
    const spec = SPEC_ATTRS[dev];
    if(!spec || !spec.gpus || spec.gpus<=0){ continue; }
    const model = spec.gpuModel || "GPU";
    const perNode = spec.gpuCountPerNode ?? spec.gpus;
    if(!agg[model]) agg[model] = {nodes:0, gpus:0};
    agg[model].nodes += qty;
    agg[model].gpus += perNode*qty;
  }
  return agg;
}

/*********************************
 * Self-tests (guarded)
 *********************************/
function runSelfTests(){
  try{
    const counts = {"Intel Control Plane Node": 2, "Edge Switch": 1};
    const t = summarize(counts);
    console.assert(t.powerW === (2*POWER_W["Intel Control Plane Node"] + POWER_W["Edge Switch"]), "powerW calc mismatch");
    console.assert(t.cores === 2*SPEC_ATTRS["Intel Control Plane Node"].cores, "cores calc mismatch");
    const empty = summarize({});
    console.assert(Object.values(empty).every(v => v === 0), "empty summarize should be zeros");

    const s1 = summarize({"sscc140": 1});
    console.assert(s1.cores === 32 && s1.sockets === 2 && s1.threads === 64, "sscc140 CPU fields wrong");
    console.assert(s1.ramGB === 512 && s1.bootGB === 480 && s1.localTB === 20, "sscc140 memory/storage wrong");
    console.assert(s1.powerW === 650 && Math.round(s1.btu) === 2200 && s1.weightLb === 60, "sscc140 power/thermal/weight wrong");
    console.assert(s1.listPrice === 45000 && s1.armadaPrice === 30000, "sscc140 pricing wrong");

    const s2 = summarize({"sscc140": 2, "Edge Switch": 3});
    console.assert(s2.powerW === 2*650 + 3*150, "aggregate power mismatch");
    console.assert(s2.ru === 2*2 + 3*1, "aggregate RU mismatch");

    const s3 = summarize({"AMD Compute Node": 1});
    console.assert(s3.listPrice === 100000 && s3.armadaPrice === 100000, "AMD Compute Node price mapping wrong");
    console.assert(s3.cores === 32 && s3.sockets === 2 && s3.threads === 64, "AMD Compute Node CPU fields wrong");

    const bd = gpuBreakdown({"Intel H100 Node": 2, "Intel L40s Node": 1});
    console.assert(bd["NVIDIA H100"].gpus === 8 && bd["NVIDIA H100"].nodes === 2, "H100 breakdown wrong");
    console.assert(bd["NVIDIA L40s"].gpus === 4 && bd["NVIDIA L40s"].nodes === 1, "L40s breakdown wrong");

    // Additional tests - will be run after all functions are defined
  }catch(e){
    console.warn("Self-tests failed:", e);
  }
}

if(!(globalThis as any).__rackTestsRan){
  runSelfTests();
  (globalThis as any).__rackTestsRan = true;
}

/*********************************
 * Main component — 5 racks
 *********************************/
export default function InteractiveRackPowerGrid(){
  const [capacityW, setCapacityW] = useState<number>(18000); // 18 kW
  const [useKw, setUseKw] = useState<boolean>(true);

  const displayCapacity = useMemo(()=> useKw ? capacityW/1000 : capacityW, [capacityW, useKw]);
  const setDisplayCapacity = useCallback((val:number)=>{
    const n = Math.max(0, Number(val) || 0);
    setCapacityW(useKw ? n*1000 : n);
  }, [useKw]);

  const RACKS = ["Rack 1","Rack 2","Rack 3","Rack 4","Rack 5"] as const;

  const [countsByRack, setCountsByRack] = useState<Record<string, Record<string, number>>>(()=> ({
    "Rack 1": {},
    "Rack 2": {},
    "Rack 3": {},
    "Rack 4": {},
    "Rack 5": {},
  }));

  const [activeRack, setActiveRack] = useState<string>(RACKS[0]);

  const rackSummaries = useMemo(()=> RACKS.map(r => {
    const totals = summarize(countsByRack[r] || {});
    const pct = capacityW>0 ? (totals.powerW/capacityW)*100 : 0;
    return { rack: r, totals, pct };
  }), [countsByRack, capacityW]);

  const setQty = useCallback((dev: string, qty: number) => {
    setCountsByRack((prev) => {
      const q = Math.max(0, Math.floor(qty || 0));
      const next = { ...prev } as Record<string, Record<string, number>>;
      const cur = { ...(next[activeRack] || {}) };
      if (q === 0) { 
        delete cur[dev]; 
      } else { 
        cur[dev] = q; 
      }
      next[activeRack] = cur;
      return next;
    });
  }, [activeRack]);

  const bump = useCallback((dev: string, delta: number) => {
    const current = (countsByRack[activeRack]||{})[dev] || 0;
    setQty(dev, current + delta);
  }, [countsByRack, activeRack, setQty]);

  const remove = useCallback((dev: string) => setQty(dev, 0), [setQty]);

  const [selectedCat, setSelectedCat] = useState<string>("Network");
  const [addDev, setAddDev] = useState<string>("");
  const filteredDevices = useMemo(() => (DEVICE_GROUPS[selectedCat] || []), [selectedCat]);
  const addDevice = useCallback(() => {
    if (!addDev) return;
    const current = (countsByRack[activeRack]||{})[addDev]||0;
    setQty(addDev, current+1);
  }, [addDev, countsByRack, activeRack, setQty]);

  const [infoDev, setInfoDev] = useState<string | null>(null);

  const activeCounts = countsByRack[activeRack] || {};
  const activeTotals = useMemo(()=> summarize(activeCounts), [activeCounts]);
  const activePct = capacityW>0 ? (activeTotals.powerW/capacityW)*100 : 0;
  const activeGpuBreakdown = useMemo(()=> gpuBreakdown(activeCounts), [activeCounts]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <PlugZap className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Interactive Rack Power Grid — 5 Racks</h1>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Capacity & Health (All Racks)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm">Capacity value ({useKw?"kW":"W"})</label>
            <Input type="number" value={Number.isFinite(displayCapacity)?displayCapacity:0} onChange={(e)=> setDisplayCapacity(Number(e.target.value))} />
            <div className="text-xs opacity-70">If Specs!C49 = 18, toggle kW and enter 18 (which is 18,000 W).</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Units</label>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="units" checked={useKw} onChange={()=> setUseKw(true)} /> kW
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="units" checked={!useKw} onChange={()=> setUseKw(false)} /> W
              </label>
            </div>
            <div className="text-xs opacity-70">Effective capacity: <b>{capacityW.toLocaleString()} W</b></div>
            <Slider value={[capacityW]} min={1000} max={60000} step={500} onValueChange={(v)=> setCapacityW(v[0])} />
          </div>
          <div className="space-y-2">
            <div className="text-sm">Overview</div>
            <div className="grid grid-cols-5 gap-2">
              {rackSummaries.map(({rack, totals, pct})=> (
                <div key={rack} className={`px-3 py-2 rounded-xl ${pct>=100?"bg-red-50":"bg-gray-100"}`}>
                  <div className="text-[10px] uppercase tracking-wide opacity-70">{rack}</div>
                  <div className="text-sm font-semibold">{totals.powerW.toLocaleString()} W</div>
                  <div className="text-xs opacity-70">{formatPct(pct)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Rack Visual (Level 1 Mock)</CardTitle></CardHeader>
        <CardContent>
          <RackVisuals
            racks={RACKS as unknown as string[]}
            countsByRack={countsByRack}
            capacityW={capacityW}
            onShowDetails={(dev)=> setInfoDev(dev)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm">Active Rack</label>
        <div className="flex gap-2">
          {RACKS.map(r => (
            <button key={r} onClick={()=> setActiveRack(r)} className={`px-3 py-1 rounded-2xl border ${activeRack===r?"bg-black text-white":"bg-white"}`}>{r}</button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>{activeRack} — Totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-sm">
          <Metric icon={<Cpu className="w-4 h-4"/>} label="Cores/Socket" value={activeTotals.sockets ? Number((activeTotals.cores/activeTotals.sockets).toFixed(1)) : 0} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="Sockets" value={activeTotals.sockets} />
          <Metric icon={<Cpu className="w-4 h-4"/>} label="Total Cores" value={activeTotals.cores} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="GPUs" value={activeTotals.gpus} />
          <Metric icon={<Database className="w-4 h-4"/>} label="RAM (GB)" value={activeTotals.ramGB} />
          <Metric icon={<HardDrive className="w-4 h-4"/>} label="Boot (GB)" value={activeTotals.bootGB} />
          <Metric icon={<HardDrive className="w-4 h-4"/>} label="Local (TB)" value={activeTotals.localTB} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="RU" value={activeTotals.ru} />
          <Metric icon={<PlugZap className="w-4 h-4"/>} label="BTU/hr" value={Math.round(activeTotals.btu)} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="Weight (lb)" value={Math.round(activeTotals.weightLb)} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="List $" value={activeTotals.listPrice.toFixed(0)} />
          <Metric icon={<Gauge className="w-4 h-4"/>} label="Armada $" value={activeTotals.armadaPrice.toFixed(0)} />
          <Metric icon={<PlugZap className="w-4 h-4"/>} label="% Power" value={formatPct(activePct)} warn={activePct>=100} />
          <Metric icon={<PlugZap className="w-4 h-4"/>} label="Power (W)" value={activeTotals.powerW.toLocaleString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>{activeRack} — GPU Breakdown by Type</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(activeGpuBreakdown).length === 0 ? (
            <div className="text-sm opacity-70">No GPUs in this rack.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeGpuBreakdown).map(([model, v]) => (
                <div key={model} className="px-3 py-2 rounded-xl bg-purple-50">
                  <div className="text-xs opacity-70">{model}</div>
                  <div className="text-sm font-semibold">{v.gpus} GPU(s) across {v.nodes} node(s)</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>{activeRack} — Devices</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm opacity-70">Category:</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(DEVICE_GROUPS).map(cat => (
                  <button key={cat} onClick={()=> { setSelectedCat(cat); setAddDev(""); }} className={`px-3 py-1 rounded-2xl border text-sm ${selectedCat===cat?"bg-black text-white":"bg-white"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select className="border rounded-xl px-3 py-2 text-sm" value={addDev} onChange={(e)=> setAddDev(e.target.value)}>
                <option value="" disabled>Select a device…</option>
                {(filteredDevices || []).map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
              {addDev && <span className="text-xs opacity-70">{SPEC_ATTRS[addDev]?.gpuModel ? `${SPEC_ATTRS[addDev].gpuModel} × ${SPEC_ATTRS[addDev].gpuCountPerNode}` : SPEC_ATTRS[addDev]?.info || ''}</span>}
              <Button onClick={addDevice} className="rounded-2xl" disabled={!addDev}><Plus className="w-4 h-4"/><span>Add to {activeRack}</span></Button>
            </div>
          </div>

          <ScrollArea className="max-h-[60vh] pr-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="opacity-70 text-left">
                  <th>Device</th>
                  <th>Category</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Cores/Socket</th>
                  <th className="text-right">Sockets</th>
                  <th className="text-right">Total Cores</th>
                  <th className="text-right">GPUs</th>
                  <th className="text-right">RAM (GB)</th>
                  <th className="text-right">Boot (GB)</th>
                  <th className="text-right">Local (TB)</th>
                  <th className="text-right">RU</th>
                  <th className="text-right">Max Power (W)</th>
                  <th className="text-right">Heat (BTU/hr)</th>
                  <th className="text-right">Weight (lb)</th>
                  <th className="text-right">List $</th>
                  <th className="text-right">Armada $</th>
                  <th className="text-right">Info</th>
                  <th className="text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(activeCounts).sort((a,b)=> a[0].localeCompare(b[0])).map(([dev, qty])=>{
                  const a = SPEC_ATTRS[dev] || {cores:0,sockets:0,threads:0,gpus:0,ramGB:0,bootGB:0,localTB:0,ru:0,powerW:POWER_W[dev]||0,btu:0,weightLb:0,listPrice:0,armadaPrice:0};
                  return (
                    <tr key={dev}>
                      <td className="py-1">{dev}</td>
                      <td className="py-1"><CatBadge name={dev} /></td>
                      <td className="py-1 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button onClick={()=> bump(dev,-1)}><Minus className="w-3 h-3"/></Button>
                          <Input className="w-16 text-right" type="number" value={qty} onChange={(e)=> setQty(dev, Number(e.target.value))} />
                          <Button onClick={()=> bump(dev,1)}><Plus className="w-3 h-3"/></Button>
                        </div>
                      </td>
                      <td className="py-1 text-right">{(a.sockets ? (a.cores / a.sockets) : a.cores)}</td>
                      <td className="py-1 text-right">{a.sockets*qty}</td>
                      <td className="py-1 text-right">{a.cores*qty}</td>
                      <td className="py-1 text-right">{a.gpus*qty}</td>
                      <td className="py-1 text-right">{a.ramGB*qty}</td>
                      <td className="py-1 text-right">{a.bootGB*qty}</td>
                      <td className="py-1 text-right">{(a.localTB*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">{a.ru*qty}</td>
                      <td className="py-1 text-right">{(a.powerW*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">{Math.round(a.btu*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">{Math.round(a.weightLb*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">${(a.listPrice*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">${(a.armadaPrice*qty).toLocaleString()}</td>
                      <td className="py-1 text-right">
                        <Button onClick={()=> setInfoDev(dev)}><Info className="w-3 h-3"/> Details</Button>
                      </td>
                      <td className="py-1 text-right">
                        <Button onClick={()=> remove(dev)}><Trash2 className="w-3 h-3"/></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t">
                  <td className="py-2">Totals</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">{activeTotals.sockets ? (activeTotals.cores/activeTotals.sockets).toFixed(1) : "0"}</td>
                  <td className="text-right">{activeTotals.sockets.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.cores.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.gpus.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.ramGB.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.bootGB.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.localTB.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.ru.toLocaleString()}</td>
                  <td className="text-right">{activeTotals.powerW.toLocaleString()}</td>
                  <td className="text-right">{Math.round(activeTotals.btu).toLocaleString()}</td>
                  <td className="text-right">{Math.round(activeTotals.weightLb).toLocaleString()}</td>
                  <td className="text-right">${activeTotals.listPrice.toLocaleString()}</td>
                  <td className="text-right">${activeTotals.armadaPrice.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {infoDev && (
        <div className="fixed inset-0 bg-black/30 flex justify-end" onClick={()=> setInfoDev(null)}>
          <div className="w-full max-w-md h-full bg-white p-5 overflow-auto" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{infoDev} — Details</h3>
              <button className="px-3 py-1 border rounded-xl" onClick={()=> setInfoDev(null)}>Close</button>
            </div>
            {(() => {
              const s = SPEC_ATTRS[infoDev!];
              if(!s) return <div className="text-sm">No details.</div>;
              return (
                <div className="space-y-2 text-sm">
                  {s.info && <div><span className="opacity-70">Summary:</span> {s.info}</div>}
                  {s.manufacturer && <div><span className="opacity-70">Manufacturer:</span> {s.manufacturer}</div>}
                  {s.sku && <div><span className="opacity-70">SKU:</span> {s.sku}</div>}
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="opacity-70">Cores/Socket:</span> {s.sockets ? (s.cores/s.sockets) : s.cores}</div>
                    <div><span className="opacity-70">Sockets:</span> {s.sockets}</div>
                    <div><span className="opacity-70">Total Cores:</span> {s.cores}</div>
                    <div><span className="opacity-70">RAM (GB):</span> {s.ramGB}</div>
                    <div><span className="opacity-70">Boot (GB):</span> {s.bootGB}</div>
                    <div><span className="opacity-70">Local (TB):</span> {s.localTB}</div>
                    <div className="opacity-70">RU: {s.ru}</div>
                    <div className="opacity-70">Power (W): {s.powerW}</div>
                    <div className="opacity-70">BTU/hr: {Math.round(s.btu)}</div>
                    <div className="opacity-70">Weight (lb): {s.weightLb}</div>
                    {s.gpuModel && <div className="col-span-2"><span className="opacity-70">GPU:</span> {s.gpuModel} × {s.gpuCountPerNode ?? s.gpus}</div>}
                    {s.acVolts && <div><span className="opacity-70">AC Voltage:</span> {s.acVolts}</div>}
                    {typeof s.acAmps === 'number' && <div><span className="opacity-70">AC Amps:</span> {s.acAmps}</div>}
                    <div><span className="opacity-70">List $:</span> ${s.listPrice.toLocaleString()}</div>
                    <div><span className="opacity-70">Armada $:</span> ${s.armadaPrice.toLocaleString()}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="text-xs opacity-60">
        Notes: Heavy-first placement is implemented in the rack visual. % Power = Total Rack Watts ÷ Capacity (W) × 100. Drag-and-drop list below each rack lets you define a manual placement order.
      </div>
    </div>
  );
}

/*********************************
 * Rack visuals (heavy-first packing + optional manual order)
 *********************************/
const RACK_U = 42;

type RackItem = { id: string; name: string; span: number; startU: number };

type RackLayout = { items: RackItem[] };

function RackVisuals({ racks, countsByRack, capacityW, onShowDetails }:{
  racks: string[];
  countsByRack: Record<string, Record<string, number>>;
  capacityW: number;
  onShowDetails: (dev:string)=>void;
}){
  // Toggle: free placement (true) vs legacy packed (false)
  const [freePlacement, setFreePlacement] = useState<boolean>(true);

  // Manual ordering list from previous version (used when freePlacement = false)
  const [orders, setOrders] = useState<Record<string, string[]>>({});

  // Explicit per-U layouts when freePlacement = true
  const [layouts, setLayouts] = useState<Record<string, RackLayout>>({});

  // DnD state
  const [hoverByRack, setHoverByRack] = useState<Record<string, number|null>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<{rack: string, id: string} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Keep manual orders and layouts in sync with counts
  useEffect(()=>{
    // sync orders
    const nextOrders: Record<string, string[]> = { ...orders };
    for(const r of racks){
      const names = Object.keys(countsByRack[r] || {});
      const existing = nextOrders[r] || [];
      const kept = existing.filter(n => names.includes(n));
      const appended = names.filter(n => !kept.includes(n));
      nextOrders[r] = [...kept, ...appended];
    }
    setOrders(nextOrders);

    // sync layouts (materialize + reconcile)
    setLayouts((prev)=>{
      const copy: Record<string, RackLayout> = { ...prev };
      for(const r of racks){
        const counts = countsByRack[r] || {};
        const current = copy[r]?.items || [];
        const reconciled = reconcileLayoutWithCounts(current, counts);
        copy[r] = { items: reconciled };
      }
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countsByRack, racks.join('|')]);

  // sorting helper for legacy (non-free) mode
  const sortEntriesForRack = useCallback((r:string)=>{
    const counts = countsByRack[r] || {};
    const entries = Object.entries(counts).filter(([name]) => !!SPEC_ATTRS[name]);
    const ord = orders[r];
    if (ord && ord.length){
      const indexOf = (name:string)=> ord.indexOf(name);
      return entries.sort((a,b)=>{
        const ia = indexOf(a[0]);
        const ib = indexOf(b[0]);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a[0].localeCompare(b[0]);
      });
    }
    // fallback heavy-first (weight desc, RU desc, name)
    return entries.sort((a, b) => {
      const wa = SPEC_ATTRS[a[0]]?.weightLb ?? 0;
      const wb = SPEC_ATTRS[b[0]]?.weightLb ?? 0;
      if (wb !== wa) return wb - wa;
      const rua = SPEC_ATTRS[a[0]]?.ru ?? 0;
      const rub = SPEC_ATTRS[b[0]]?.ru ?? 0;
      if (rub !== rua) return rub - rua;
      return a[0].localeCompare(b[0]);
    });
  }, [countsByRack, orders]);

  // Hover helpers
  const onBoundaryOver = (rack:string, boundary:number)=>(e:React.DragEvent)=>{
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    console.log('Drag over boundary:', boundary, 'in rack:', rack);
    setHoverByRack(p=>({...p, [rack]: boundary}));
  };
  const clearHover = (rack:string)=>(e?:React.DragEvent)=>{
    if(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setHoverByRack(p=>({...p, [rack]: null}));
  };

  const onItemDragStart = (rack:string, id:string)=>(e:React.DragEvent)=>{
    console.log('Drag start ENTRY:', { rack, id });

    try {
      const payload = JSON.stringify({ rack, id });
      e.dataTransfer.setData('text/plain', payload);
      e.dataTransfer.effectAllowed = 'move';

      console.log('About to set isDragging to true...');
      setIsDragging(true);
      console.log('setIsDragging(true) called');

      // Force immediate re-render to see if state actually updates
      setTimeout(() => {
        console.log('After timeout - checking if isDragging updated');
      }, 10);

    } catch (error) {
      console.error('Error in drag start:', error);
    }
  };

  const onBoundaryDrop = (rack:string, boundary:number)=>(e:React.DragEvent)=>{
    e.preventDefault();
    e.stopPropagation();

    const data = e.dataTransfer.getData('text/plain');
    console.log('Drop data:', data, 'boundary:', boundary, 'rack:', rack);

    try{
      const { rack: sourceRack, id } = JSON.parse(data);
      console.log('Parsed:', { sourceRack, id });

      if (sourceRack !== rack) {
        console.log('Cross-rack drop not implemented yet');
        return;
      }

      setLayouts(prev=>{
        const cur = prev[rack]?.items || [];
        const idx = cur.findIndex(it=> it.id === id);
        console.log('Item index:', idx, 'items:', cur);

        if (idx === -1) {
          console.log('Item not found');
          return prev;
        }

        const it = cur[idx];
        const span = it.span;
        let startU = boundary;

        // Ensure item fits within rack bounds
        if (startU + span - 1 > RACK_U) {
          startU = RACK_U - span + 1;
        }
        if (startU < 1) {
          startU = 1;
        }

        console.log('Trying to place at:', startU, 'span:', span);

        // Check if placement is valid
        if (!placementValid(cur, idx, startU, span)) {
          console.log('Position invalid, finding nearest valid position');
          // Find nearest valid position
          let found = false;
          for (let offset = 1; offset <= RACK_U && !found; offset++) {
            // Try above
            let tryU = startU - offset;
            if (tryU >= 1 && tryU + span - 1 <= RACK_U && placementValid(cur, idx, tryU, span)) {
              startU = tryU;
              found = true;
              break;
            }
            // Try below
            tryU = startU + offset;
            if (tryU >= 1 && tryU + span - 1 <= RACK_U && placementValid(cur, idx, tryU, span)) {
              startU = tryU;
              found = true;
              break;
            }
          }
          if (!found) {
            console.log('No valid position found');
            return prev;
          }
        }

        console.log('Final placement:', startU);
        const nextItems = cur.map((x,i)=> i===idx ? { ...x, startU } : x);
        return { ...prev, [rack]: { items: nextItems } };
      });
    } catch(error) {
      console.error('Drop error:', error);
    }

    setHoverByRack(p=>({...p, [rack]: null}));
    setIsDragging(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {racks.map((r)=>{
        const counts = countsByRack[r] || {};
        const totals = summarize(counts);
        const pct = capacityW>0 ? (totals.powerW/capacityW)*100 : 0;

        const legacyEntries = sortEntriesForRack(r);
        const legacyTiles = computeRackTilesFromEntries(legacyEntries);
        const layoutItems = layouts[r]?.items || [];
        const hoverBoundary = hoverByRack[r] ?? null;

        return (
          <div key={r} className="border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{r}</div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${pct>=100?"bg-red-100 text-red-700": pct>=80?"bg-amber-100 text-amber-700":"bg-green-100 text-green-700"}`}>{formatPct(pct)}</div>
            </div>

            <div className="flex items-center justify-between mb-2 text-xs">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={freePlacement} onChange={()=> setFreePlacement(v=>!v)} /> Free placement mode</label>
              {!freePlacement && <span className="opacity-60">Drag list below controls legacy order</span>}
              {freePlacement && <button className="px-2 py-0.5 border rounded-lg" onClick={()=> setLayouts(s=>({ ...s, [r]: { items: materializeCountsToLayout(counts) } }))}>Reset packing</button>}
            </div>

            <div className="flex gap-3" data-rack-id={r}>
              <div className="relative" style={{width:140}}>
                <div className="grid" style={{gridTemplateRows:`repeat(${RACK_U}, 16px)`, height: RACK_U*16}}>
                  {Array.from({length:RACK_U}).map((_,i)=> (
                    <div key={i} className="border-b border-dashed text-[10px] leading-[16px] text-right pr-1 opacity-40">
                      {RACK_U - i}U
                    </div>
                  ))}
                </div>
                {/* Tiles */}
                <div className="absolute inset-0 left-0 top-0" style={{ zIndex: 10 }}>
                  {layoutItems.length > 0 ? (() => { console.log('Layout items for', r, ':', layoutItems); return null; })() : null}
                  {layoutItems.map((it)=>{
                    const spec = SPEC_ATTRS[it.name];
                    const category = CATEGORY_OF[it.name] || 'Misc';
                    return (
                      <div
                        key={it.id}
                        className={`ml-1 mr-1 rounded-md border text-[10px] px-1 ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}`}
                        style={{
                          position:'absolute',
                          bottom:(it.startU-1)*16,
                          height:it.span*16,
                          left:0,
                          right:0,
                          opacity: draggedItem?.id === it.id ? 0.3 : 0.95,
                          cursor:'grab',
                          zIndex: draggedItem?.id === it.id ? 1000 : 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          userSelect: 'none'
                        }}
                        title={`${it.name} • ${it.span}U • ${spec?.powerW ?? 0} W`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          console.log('Starting mouse drag for:', it.id);
                          setDraggedItem({rack: r, id: it.id});
                          setIsDragging(true);
                          setMousePos({x: e.clientX, y: e.clientY});

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            setMousePos({x: moveEvent.clientX, y: moveEvent.clientY});
                          };

                          const handleMouseUp = (upEvent: MouseEvent) => {
                            console.log('Mouse up - ending drag');

                            // Find which rack we're over
                            const element = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
                            const rackElement = element?.closest('[data-rack-id]');

                            if (rackElement) {
                              const rackId = rackElement.getAttribute('data-rack-id');
                              const rackRect = rackElement.getBoundingClientRect();
                              const y = upEvent.clientY - rackRect.top;
                              const uFromBottom = Math.floor(y / 16) + 1;
                              const boundary = Math.max(1, Math.min(RACK_U, RACK_U - uFromBottom + 1));

                              console.log('Dropped on rack:', rackId, 'boundary:', boundary);

                              if (rackId === r) {
                                // Same rack - move item
                                setLayouts(prev => {
                                  const cur = prev[r]?.items || [];
                                  const idx = cur.findIndex(item => item.id === it.id);
                                  if (idx === -1) return prev;

                                  const item = cur[idx];
                                  const span = item.span;
                                  let startU = boundary;

                                  // Ensure fits in rack
                                  if (startU + span - 1 > RACK_U) startU = RACK_U - span + 1;
                                  if (startU < 1) startU = 1;

                                  // Check for conflicts and find valid position
                                  if (!placementValid(cur, idx, startU, span)) {
                                    for (let offset = 1; offset <= RACK_U && !placementValid(cur, idx, startU, span); offset++) {
                                      let tryU = startU - offset;
                                      if (tryU >= 1 && tryU + span - 1 <= RACK_U && placementValid(cur, idx, tryU, span)) {
                                        startU = tryU; break;
                                      }
                                      tryU = startU + offset;
                                      if (tryU >= 1 && tryU + span - 1 <= RACK_U && placementValid(cur, idx, tryU, span)) {
                                        startU = tryU; break;
                                      }
                                    }
                                  }

                                  const nextItems = cur.map((x, i) => i === idx ? {...x, startU} : x);
                                  return {...prev, [r]: {items: nextItems}};
                                });
                              }
                            }

                            setDraggedItem(null);
                            setIsDragging(false);
                            setHoverByRack({});
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      >
                        <span style={{pointerEvents: 'none'}} className="truncate">{shortName(it.name)}</span>
                        <span style={{pointerEvents: 'none'}}>{it.span}U</span>
                      </div>
                    );
                  })}

                  {/* Hover ghost indicator */}
                  {hoverBoundary!==null && (
                    <div className="absolute left-0 right-0 border-2 border-blue-500 bg-blue-100 bg-opacity-50 rounded" style={{bottom: (hoverBoundary-1)*16, height:16}} />
                  )}
                </div>

                {/* Drop zone indicator for mouse-based drag */}
                {isDragging && (
                  <div className="absolute inset-0 left-0 top-0 bg-blue-100 bg-opacity-30 border-2 border-dashed border-blue-400" style={{ zIndex: 5 }}>
                    <div className="text-center text-blue-800 text-xs mt-2">Drop here to move item</div>
                  </div>
                )}
              </div>

              <div className="text-xs opacity-70 space-y-1">
                <div><b>Power:</b> {totals.powerW.toLocaleString()} W</div>
                <div><b>RU used:</b> {totals.ru} / {RACK_U}U</div>
                <div><b>Weight:</b> {Math.round(totals.weightLb).toLocaleString()} lb</div>
              </div>
            </div>

            {totals.ru>RACK_U && (
              <div className="mt-2 text-xs text-red-700">Overflow: {totals.ru - RACK_U}U beyond {RACK_U}U</div>
            )}

            {/* Manual ordering list only shown when legacy mode */}
            {!freePlacement && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wide opacity-60 mb-1">Manual order (drag to rearrange)</div>
                <ul className="border rounded-lg divide-y">
                  {(orders[r]||legacyEntries.map(e=>e[0])).map((name, idx)=> (
                    <li key={name}
                        draggable
                        onDragStart={(e)=>{ e.dataTransfer.setData('text/plain', JSON.stringify({ rack:r, index:idx })); }}
                        onDragOver={(e)=> e.preventDefault()}
                        onDrop={(e)=>{ e.preventDefault(); try{ const { rack, index } = JSON.parse(e.dataTransfer.getData('text/plain')); if(rack!==r) return; const cur = orders[r]||[]; const next=[...cur]; const [m]=next.splice(index,1); next.splice(idx,0,m); setOrders({...orders,[r]:next}); }catch{} }}
                        className="bg-white px-2 py-1 text-xs flex items-center justify-between hover:bg-gray-50 cursor-move select-none">
                      <span className="truncate pr-2">{name}</span>
                      <span className="opacity-50">⇅</span>
                    </li>
                  ))}
                  <li key="__end__" className="px-2 py-1 text-center text-[11px] text-gray-500">Legacy ordering list</li>
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function computeRackTiles(counts: Record<string, number>){
  type Tile = {name:string; qty:number; span:number; start:number; watts:number; category:string; short:string};
  const entries = Object.entries(counts)
    .filter(([name]) => !!SPEC_ATTRS[name])
    .sort((a, b) => {
      const wa = SPEC_ATTRS[a[0]]?.weightLb ?? 0;
      const wb = SPEC_ATTRS[b[0]]?.weightLb ?? 0;
      if (wb !== wa) return wb - wa;
      const rua = SPEC_ATTRS[a[0]]?.ru ?? 0;
      const rub = SPEC_ATTRS[b[0]]?.ru ?? 0;
      if (rub !== rua) return rub - rua;
      return a[0].localeCompare(b[0]);
    });

  const tiles: Tile[] = [];
  let cursor = RACK_U;
  for(const [name, qty] of entries){
    const spec = SPEC_ATTRS[name];
    if(!spec) continue;
    const span = Math.min(spec.ru * qty, cursor);
    if(span <= 0) continue;
    const start = cursor - span + 1;
    cursor -= span;
    const watts = (spec.powerW * qty);
    const category = CATEGORY_OF[name] || 'Misc';
    tiles.push({name, qty, span, start, watts, category, short: shortName(name)});
    if(cursor<=0) break;
  }
  return tiles;
}

function computeRackTilesFromEntries(entries: [string, number][]) {
  type Tile = {name:string; qty:number; span:number; start:number; watts:number; category:string; short:string};
  const tiles: Tile[] = [];
  let cursor = RACK_U;
  for(const [name, qty] of entries){
    const spec = SPEC_ATTRS[name];
    if(!spec) continue;
    const span = Math.min(spec.ru * qty, cursor);
    if(span <= 0) continue;
    const start = cursor - span + 1;
    cursor -= span;
    const watts = (spec.powerW * qty);
    const category = CATEGORY_OF[name] || 'Misc';
    tiles.push({name, qty, span, start, watts, category, short: shortName(name)});
    if(cursor<=0) break;
  }
  return tiles;
}

// Helpers for free placement
function placementValid(items: RackItem[], movingIndex: number, startU: number, span: number){
  const endU = startU + span - 1;
  if (startU < 1 || endU > RACK_U) return false;
  for(let i=0;i<items.length;i++){
    if (i===movingIndex) continue;
    const a = items[i];
    const aStart = a.startU;
    const aEnd = a.startU + a.span - 1;
    const overlap = !(endU < aStart || aEnd < startU);
    if (overlap) return false;
  }
  return true;
}

function materializeCountsToLayout(counts: Record<string, number>): RackItem[]{
  const entries = Object.entries(counts)
    .filter(([n])=> SPEC_ATTRS[n])
    .sort((a,b)=>{
      const wa = SPEC_ATTRS[a[0]]?.weightLb ?? 0;
      const wb = SPEC_ATTRS[b[0]]?.weightLb ?? 0;
      if (wb !== wa) return wb - wa;
      const rua = SPEC_ATTRS[a[0]]?.ru ?? 0;
      const rub = SPEC_ATTRS[b[0]]?.ru ?? 0;
      if (rub !== rua) return rub - rua;
      return a[0].localeCompare(b[0]);
    });
  const items: RackItem[] = [];
  let cursor = 1;
  for(const [name, qty] of entries){
    const span = SPEC_ATTRS[name].ru || 1;
    for(let i=0;i<qty;i++){
      if (cursor + span - 1 > RACK_U) break;
      items.push({ id: `${name}-${i}-${Math.random().toString(36).slice(2,7)}`, name, span, startU: cursor });
      cursor += span;
    }
  }
  return items;
}

function reconcileLayoutWithCounts(current: RackItem[], counts: Record<string, number>): RackItem[]{
  const desired: Record<string, number> = { ...counts };
  const byName: Record<string, RackItem[]> = {};
  for(const it of current){ (byName[it.name] ||= []).push(it); }

  let items = current.slice();
  for(const [name, arr] of Object.entries(byName)){
    const need = desired[name] ?? 0;
    if (arr.length > need){
      const surplus = arr.length - need;
      for(let i=0;i<surplus;i++){
        const idx = items.findIndex(x=> x.name===name);
        const ri = (items as any).findLastIndex ? (items as any).findLastIndex((x: RackItem)=> x.name===name) : -1;
        items.splice(ri!==-1?ri:idx, 1);
      }
    }
  }

  for(const [name, need] of Object.entries(desired)){
    const have = items.filter(x=> x.name===name).length;
    const span = SPEC_ATTRS[name]?.ru || 1;
    for(let i=have;i<need;i++){
      let placed = false;
      for(let start=1; start<=RACK_U-span+1; start++){
        if (placementValid(items, -1, start, span)){
          items.push({ id: `${name}-${i}-${Math.random().toString(36).slice(2,7)}`, name, span, startU: start });
          placed = true; break;
        }
      }
      if (!placed){
        items.push({ id: `${name}-${i}-${Math.random().toString(36).slice(2,7)}`, name, span, startU: 1 });
      }
    }
  }

  return items;
}

function shortName(name:string){
  return name
    .replace('Intel ','I ')
    .replace('AMD ','A ')
    .replace('Compute Node','CN')
    .replace('Control Plane Node','CP')
    .replace('Admin Node','Admin')
    .replace('Switch','Sw');
}
