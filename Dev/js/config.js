// ══════════════════════════════════════════════════════
//  ⚙️  CONFIGURACIÓN
// ══════════════════════════════════════════════════════
const SUPABASE_URL  = 'https://nbvfrumnvpnlzawrfjen.supabase.co';
const SUPABASE_ANON = 'sb_publishable_5aAdITi_TZ9XptWj6vwaKQ_Lz8Oaqyr';
const RAPIDAPI_KEY  = '';

// Precios editados manualmente por el coach

const SUPERS = ['merc','lidl','carrefour','dia','eroski'];
const SUPER_LABELS = {merc:'Mercadona',lidl:'Lidl',carrefour:'Carrefour',dia:'Dia',eroski:'Eroski'};
const SUPER_COLORS = {merc:'var(--accent)',lidl:'var(--accent2)',carrefour:'var(--blue)',dia:'var(--orange)',eroski:'var(--purple)'};

// Supabase init — compatible con UMD (jsdelivr) y ESM
const _supa = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
if (!_supa) { console.error('[EFK] FATAL: supabase CDN no cargó correctamente'); }
const { createClient } = _supa || {};
const sb = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
let currentUser    = null;
let currentProfile = null;
let currentClientId = null;
let allClients     = [];

let DIET     = {};
let MEAL_NOTES = {}; // {desayuno:'',comida:'', ...} notas del coach por tipo de comida, por cliente
function getDefaultDB(){return {avena:{base:'100g',kcal:389,prot:17,carb:66,fat:7,fib:10},'scoop proteina':{base:'1ud',kcal:120,prot:25,carb:3,fat:2,fib:0},patata:{base:'100g',kcal:77,prot:2,carb:17,fat:0.1,fib:2.2},'queso fresco batido':{base:'100g',kcal:72,prot:8,carb:3,fat:3,fib:0},'leche de soja':{base:'100ml',kcal:33,prot:3.3,carb:1.2,fat:1.8,fib:0.4},'crema de arroz':{base:'100g',kcal:360,prot:7,carb:79,fat:1,fib:1},merluza:{base:'100g',kcal:82,prot:18,carb:0,fat:1,fib:0},'arandanos congelados':{base:'100g',kcal:57,prot:0.7,carb:14,fat:0.3,fib:2.4},'platano pequeno':{base:'1ud',kcal:89,prot:1.1,carb:23,fat:0.3,fib:2.6},'esparragos trigueros':{base:'100g',kcal:20,prot:2.2,carb:3.9,fat:0.1,fib:2.1},'frambuesas congeladas':{base:'100g',kcal:52,prot:1.2,carb:12,fat:0.7,fib:6.5},'yogur natural entero':{base:'1ud',kcal:90,prot:5,carb:6,fat:5,fib:0},kiwi:{base:'1ud',kcal:61,prot:1.1,carb:15,fat:0.5,fib:3},'huevo entero':{base:'1ud',kcal:70,prot:6,carb:0.4,fat:4.8,fib:0},almendras:{base:'100g',kcal:579,prot:21,carb:22,fat:50,fib:12.5},fresas:{base:'100g',kcal:32,prot:0.7,carb:7.7,fat:0.3,fib:2},pechuga:{base:'100g',kcal:165,prot:31,carb:0,fat:3.6,fib:0},'queso cottage light':{base:'100g',kcal:72,prot:12,carb:3,fat:1,fib:0},tomate:{base:'100g',kcal:18,prot:0.9,carb:3.9,fat:0.2,fib:1.2},mandarina:{base:'1ud',kcal:40,prot:0.8,carb:10,fat:0.3,fib:1.5},'arroz integral':{base:'100g',kcal:355,prot:7.5,carb:74,fat:2.7,fib:3.5},'atun tarro cristal':{base:'100g',kcal:116,prot:26,carb:0,fat:1,fib:0},lechuga:{base:'1ud',kcal:15,prot:1.4,carb:2.9,fat:0.2,fib:1.3},'carne de conejo':{base:'100g',kcal:136,prot:20,carb:0,fat:6,fib:0},'pimiento tricolor congelado':{base:'100g',kcal:27,prot:1,carb:6.3,fat:0.2,fib:2},'pan integral':{base:'1ud',kcal:80,prot:3,carb:15,fat:1,fib:2},'masa pizza integral':{base:'1ud',kcal:300,prot:9,carb:58,fat:3,fib:4},lentejas:{base:'100g',kcal:116,prot:9,carb:20,fat:0.4,fib:8},'tomate frito':{base:'100g',kcal:80,prot:1.5,carb:12,fat:3,fib:1.5},espelta:{base:'100g',kcal:338,prot:14.5,carb:65,fat:2.4,fib:11},brocoli:{base:'100g',kcal:34,prot:2.8,carb:7,fat:0.4,fib:2.6},'tiras de pollo':{base:'100g',kcal:165,prot:31,carb:0,fat:3.6,fib:0},mozarella:{base:'100g',kcal:280,prot:22,carb:2,fat:22,fib:0},'filete ternera':{base:'100g',kcal:179,prot:26,carb:0,fat:8,fib:0}};}
function getDefaultPrices(){return {almendras:{merc:3.29,lidl:2.99,carrefour:3.49,dia:3.09,eroski:3.35,base:'200g'},'arandanos congelados':{merc:2.99,lidl:2.49,carrefour:3.19,dia:2.59,eroski:2.99,base:'300g'},'arroz integral':{merc:1.59,lidl:1.29,carrefour:1.79,dia:1.39,eroski:1.59,base:'1kg'},'atun tarro cristal':{merc:1.89,lidl:1.69,carrefour:1.99,dia:1.75,eroski:1.89,base:'160g'},avena:{merc:1.99,lidl:1.39,carrefour:2.09,dia:1.49,eroski:1.89,base:'500g'},brocoli:{merc:0.99,lidl:0.89,carrefour:1.09,dia:0.89,eroski:0.99,base:'ud'},'carne de conejo':{merc:6.99,lidl:5.99,carrefour:7.49,dia:6.49,eroski:7.09,base:'kg'},'crema de arroz':{merc:3.49,lidl:3.29,carrefour:3.69,dia:3.35,eroski:3.49,base:'500g'},'esparragos trigueros':{merc:1.29,lidl:1.09,carrefour:1.39,dia:1.15,eroski:1.29,base:'300g'},espelta:{merc:2.49,lidl:1.99,carrefour:2.69,dia:2.09,eroski:2.45,base:'500g'},'filete ternera':{merc:9.99,lidl:8.99,carrefour:10.99,dia:9.49,eroski:10.29,base:'kg'},'frambuesas congeladas':{merc:2.79,lidl:2.39,carrefour:2.99,dia:2.49,eroski:2.79,base:'300g'},fresas:{merc:1.99,lidl:1.69,carrefour:2.09,dia:1.79,eroski:1.99,base:'500g'},'huevo entero':{merc:1.89,lidl:1.59,carrefour:1.99,dia:1.65,eroski:1.85,base:'6ud'},kiwi:{merc:1.49,lidl:1.29,carrefour:1.59,dia:1.35,eroski:1.49,base:'4ud'},'leche de soja':{merc:1.29,lidl:0.99,carrefour:1.39,dia:1.09,eroski:1.25,base:'1L'},lechuga:{merc:0.89,lidl:0.79,carrefour:0.99,dia:0.79,eroski:0.89,base:'ud'},lentejas:{merc:0.99,lidl:0.79,carrefour:1.09,dia:0.85,eroski:0.99,base:'500g'},mandarina:{merc:1.49,lidl:1.29,carrefour:1.59,dia:1.35,eroski:1.49,base:'malla'},'masa pizza integral':{merc:1.99,lidl:1.79,carrefour:2.19,dia:1.89,eroski:1.99,base:'ud'},merluza:{merc:7.99,lidl:6.99,carrefour:8.49,dia:7.49,eroski:7.99,base:'kg'},mozarella:{merc:1.39,lidl:1.19,carrefour:1.49,dia:1.25,eroski:1.39,base:'125g'},'pan integral':{merc:1.79,lidl:1.39,carrefour:1.89,dia:1.49,eroski:1.75,base:'ud'},patata:{merc:1.19,lidl:0.99,carrefour:1.29,dia:1.05,eroski:1.19,base:'kg'},pechuga:{merc:5.99,lidl:5.29,carrefour:6.49,dia:5.49,eroski:5.99,base:'kg'},'pimiento tricolor congelado':{merc:2.49,lidl:1.99,carrefour:2.69,dia:2.09,eroski:2.49,base:'400g'},'platano pequeno':{merc:1.29,lidl:1.09,carrefour:1.39,dia:1.15,eroski:1.29,base:'kg'},'queso cottage light':{merc:1.89,lidl:1.69,carrefour:1.99,dia:1.75,eroski:1.89,base:'250g'},'queso fresco batido':{merc:1.59,lidl:1.39,carrefour:1.69,dia:1.45,eroski:1.55,base:'500g'},'scoop proteina':{merc:39.99,lidl:null,carrefour:42.99,dia:null,eroski:null,base:'kg'},'tiras de pollo':{merc:4.99,lidl:4.49,carrefour:5.49,dia:4.69,eroski:4.99,base:'kg'},tomate:{merc:0.99,lidl:0.89,carrefour:1.09,dia:0.89,eroski:0.99,base:'kg'},'tomate frito':{merc:0.89,lidl:0.75,carrefour:0.95,dia:0.79,eroski:0.89,base:'350g'},'yogur natural entero':{merc:0.45,lidl:0.39,carrefour:0.49,dia:0.41,eroski:0.45,base:'ud'}};}
let DB       = getDefaultDB();
let PRICES   = getDefaultPrices();

// ── MICRONUTRIENTS DB (vitamins & minerals per base unit, same base as DB) ──
// Values: vA(µg), vC(mg), vD(µg), vE(mg), vK(µg), B1(mg), B2(mg), B3(mg), B6(mg), B12(µg), fol(µg), Ca(mg), Fe(mg), Zn(mg), Mg(mg), K(mg)
function getDefaultMicros(){return{
  avena:             {vA:0,   vC:0,    vD:0,   vE:0.7,  vK:2,    B1:0.76, B2:0.14, B3:0.96, B6:0.12, B12:0,   fol:56,  Ca:54,  Fe:4.7, Zn:3.6, Mg:177, K:429},
  'scoop proteina':  {vA:0,   vC:2,    vD:2,   vE:2,    vK:0,    B1:0.1,  B2:0.1,  B3:5,    B6:0.5,  B12:1.5, fol:50,  Ca:200, Fe:3,   Zn:3,   Mg:30,  K:200},
  patata:            {vA:0,   vC:19.7, vD:0,   vE:0.01, vK:2,    B1:0.08, B2:0.03, B3:1.5,  B6:0.3,  B12:0,   fol:16,  Ca:12,  Fe:0.8, Zn:0.3, Mg:23,  K:421},
  'queso fresco batido':{vA:50,vC:0.2, vD:0.1, vE:0.1,  vK:0,    B1:0.03, B2:0.15, B3:0.1,  B6:0.05, B12:0.4, fol:12,  Ca:100, Fe:0.1, Zn:0.5, Mg:10,  K:130},
  'leche de soja':   {vA:30,  vC:0,    vD:1.0, vE:0.2,  vK:0,    B1:0.04, B2:0.02, B3:0.5,  B6:0.05, B12:0.6, fol:18,  Ca:120, Fe:0.5, Zn:0.3, Mg:15,  K:118},
  'crema de arroz':  {vA:0,   vC:0,    vD:0,   vE:0.1,  vK:0,    B1:0.14, B2:0.03, B3:2.9,  B6:0.15, B12:0,   fol:8,   Ca:10,  Fe:0.8, Zn:1.1, Mg:43,  K:86},
  merluza:           {vA:25,  vC:0,    vD:3.0, vE:0.6,  vK:0.1,  B1:0.05, B2:0.07, B3:3.0,  B6:0.2,  B12:1.0, fol:10,  Ca:21,  Fe:0.5, Zn:0.5, Mg:26,  K:430},
  'arandanos congelados':{vA:3,vC:6,   vD:0,   vE:0.6,  vK:12,   B1:0.04, B2:0.04, B3:0.4,  B6:0.05, B12:0,   fol:6,   Ca:6,   Fe:0.3, Zn:0.2, Mg:6,   K:77},
  'platano pequeno': {vA:3,   vC:7.5,  vD:0,   vE:0.1,  vK:0.5,  B1:0.03, B2:0.07, B3:0.7,  B6:0.3,  B12:0,   fol:20,  Ca:5,   Fe:0.3, Zn:0.15,Mg:27,  K:358},
  'esparragos trigueros':{vA:38,vC:5.6,vD:0,   vE:1.1,  vK:52,   B1:0.14, B2:0.14, B3:1.0,  B6:0.09, B12:0,   fol:52,  Ca:24,  Fe:2.1, Zn:0.5, Mg:14,  K:202},
  'frambuesas congeladas':{vA:2,vC:26, vD:0,   vE:0.9,  vK:7.8,  B1:0.02, B2:0.03, B3:0.6,  B6:0.06, B12:0,   fol:21,  Ca:25,  Fe:0.7, Zn:0.4, Mg:22,  K:151},
  'yogur natural entero':{vA:50,vC:0.5,vD:0.1, vE:0.1,  vK:0,    B1:0.04, B2:0.23, B3:0.1,  B6:0.06, B12:0.5, fol:11,  Ca:150, Fe:0.1, Zn:0.7, Mg:14,  K:234},
  kiwi:              {vA:3,   vC:64,   vD:0,   vE:1.0,  vK:34,   B1:0.03, B2:0.02, B3:0.3,  B6:0.06, B12:0,   fol:25,  Ca:34,  Fe:0.3, Zn:0.1, Mg:17,  K:312},
  'huevo entero':    {vA:80,  vC:0,    vD:1.1, vE:1.0,  vK:0.3,  B1:0.04, B2:0.25, B3:0.1,  B6:0.1,  B12:0.9, fol:24,  Ca:25,  Fe:0.9, Zn:0.7, Mg:6,   K:69},
  almendras:         {vA:0,   vC:0,    vD:0,   vE:25.6, vK:0,    B1:0.21, B2:0.78, B3:3.6,  B6:0.14, B12:0,   fol:50,  Ca:264, Fe:3.7, Zn:3.1, Mg:270, K:705},
  fresas:            {vA:1,   vC:58.8, vD:0,   vE:0.3,  vK:2.2,  B1:0.02, B2:0.02, B3:0.4,  B6:0.05, B12:0,   fol:24,  Ca:16,  Fe:0.4, Zn:0.1, Mg:13,  K:153},
  pechuga:           {vA:2,   vC:0,    vD:0.2, vE:0.3,  vK:0,    B1:0.07, B2:0.1,  B3:13.7, B6:0.9,  B12:0.3, fol:4,   Ca:5,   Fe:0.7, Zn:1.0, Mg:29,  K:256},
  'queso cottage light':{vA:50,vC:0,   vD:0.1, vE:0.1,  vK:0,    B1:0.03, B2:0.15, B3:0.1,  B6:0.07, B12:0.6, fol:12,  Ca:83,  Fe:0.1, Zn:0.4, Mg:8,   K:104},
  tomate:            {vA:42,  vC:13.7, vD:0,   vE:0.5,  vK:7.9,  B1:0.04, B2:0.02, B3:0.6,  B6:0.08, B12:0,   fol:15,  Ca:10,  Fe:0.3, Zn:0.2, Mg:11,  K:237},
  mandarina:         {vA:34,  vC:27,   vD:0,   vE:0.2,  vK:0,    B1:0.06, B2:0.03, B3:0.3,  B6:0.07, B12:0,   fol:16,  Ca:37,  Fe:0.1, Zn:0.07,Mg:12,  K:166},
  'arroz integral':  {vA:0,   vC:0,    vD:0,   vE:0.6,  vK:1.9,  B1:0.19, B2:0.03, B3:3.5,  B6:0.28, B12:0,   fol:9,   Ca:3,   Fe:1.8, Zn:1.1, Mg:143, K:223},
  'atun tarro cristal':{vA:50,vC:0,    vD:4.5, vE:1.0,  vK:0,    B1:0.05, B2:0.1,  B3:15.0, B6:0.46, B12:2.2, fol:3,   Ca:10,  Fe:1.0, Zn:0.7, Mg:30,  K:444},
  lechuga:           {vA:166, vC:9,    vD:0,   vE:0.4,  vK:102,  B1:0.07, B2:0.07, B3:0.4,  B6:0.09, B12:0,   fol:74,  Ca:36,  Fe:0.9, Zn:0.3, Mg:14,  K:247},
  'carne de conejo': {vA:0,   vC:0,    vD:0,   vE:0.5,  vK:0,    B1:0.07, B2:0.15, B3:8.0,  B6:0.5,  B12:5.0, fol:8,   Ca:21,  Fe:1.5, Zn:1.3, Mg:21,  K:296},
  'pimiento tricolor congelado':{vA:157,vC:100,vD:0,    vE:0.7,  vK:8,    B1:0.05, B2:0.06, B3:1.0,  B6:0.3,  B12:0,   fol:26,  Ca:10,  Fe:0.4, Zn:0.2, Mg:12,  K:211},
  'pan integral':    {vA:0,   vC:0,    vD:0,   vE:0.1,  vK:1.4,  B1:0.1,  B2:0.05, B3:1.9,  B6:0.1,  B12:0,   fol:30,  Ca:24,  Fe:1.5, Zn:0.6, Mg:24,  K:109},
  'masa pizza integral':{vA:0,vC:0,    vD:0,   vE:0.5,  vK:2,    B1:0.3,  B2:0.1,  B3:3.0,  B6:0.1,  B12:0,   fol:25,  Ca:20,  Fe:2.0, Zn:1.0, Mg:40,  K:120},
  lentejas:          {vA:1,   vC:1.5,  vD:0,   vE:0.1,  vK:1.7,  B1:0.47, B2:0.24, B3:2.6,  B6:0.54, B12:0,   fol:479, Ca:35,  Fe:6.5, Zn:3.3, Mg:122, K:677},
  'tomate frito':    {vA:90,  vC:15,   vD:0,   vE:1.5,  vK:10,   B1:0.05, B2:0.04, B3:0.8,  B6:0.1,  B12:0,   fol:15,  Ca:25,  Fe:1.0, Zn:0.3, Mg:18,  K:300},
  espelta:           {vA:0,   vC:0,    vD:0,   vE:0.8,  vK:3,    B1:0.36, B2:0.11, B3:6.8,  B6:0.23, B12:0,   fol:65,  Ca:27,  Fe:4.4, Zn:3.3, Mg:136, K:388},
  brocoli:           {vA:31,  vC:89.2, vD:0,   vE:0.8,  vK:101,  B1:0.07, B2:0.12, B3:0.6,  B6:0.18, B12:0,   fol:63,  Ca:47,  Fe:0.7, Zn:0.4, Mg:21,  K:316},
  'tiras de pollo':  {vA:2,   vC:0,    vD:0.2, vE:0.3,  vK:0,    B1:0.07, B2:0.1,  B3:13.7, B6:0.9,  B12:0.3, fol:4,   Ca:5,   Fe:0.7, Zn:1.0, Mg:29,  K:256},
  mozarella:         {vA:185, vC:0,    vD:0.2, vE:0.2,  vK:2,    B1:0.01, B2:0.21, B3:0.1,  B6:0.03, B12:0.7, fol:7,   Ca:505, Fe:0.3, Zn:2.9, Mg:20,  K:76},
  'filete ternera':  {vA:2,   vC:0,    vD:0.5, vE:0.3,  vK:1.0,  B1:0.06, B2:0.18, B3:5.1,  B6:0.4,  B12:2.0, fol:7,   Ca:6,   Fe:2.4, Zn:3.7, Mg:20,  K:318},
};}
let MICROS_DB = getDefaultMicros();

const VITAMIN_META = {
  vA: {label:'Vit. A',    unit:'µg', rda:750,   emoji:'👁'},
  vC: {label:'Vit. C',    unit:'mg', rda:80,    emoji:'🍊'},
  vD: {label:'Vit. D',    unit:'µg', rda:15,    emoji:'☀️'},
  vE: {label:'Vit. E',    unit:'mg', rda:12,    emoji:'🌿'},
  vK: {label:'Vit. K',    unit:'µg', rda:75,    emoji:'🥦'},
  B1: {label:'B1 Tiamina',unit:'mg', rda:1.1,   emoji:'🌾'},
  B2: {label:'B2 Ribofla.',unit:'mg',rda:1.4,   emoji:'🥚'},
  B3: {label:'B3 Niacina',unit:'mg', rda:16,    emoji:'🥩'},
  B6: {label:'Vit. B6',   unit:'mg', rda:1.4,   emoji:'🐟'},
  B12:{label:'Vit. B12',  unit:'µg', rda:2.4,   emoji:'🥩'},
  fol:{label:'Folato B9', unit:'µg', rda:400,   emoji:'🥬'},
  Ca: {label:'Calcio',    unit:'mg', rda:1000,  emoji:'🥛'},
  Fe: {label:'Hierro',    unit:'mg', rda:14,    emoji:'🫀'},
  Zn: {label:'Zinc',      unit:'mg', rda:10,    emoji:'💪'},
  Mg: {label:'Magnesio',  unit:'mg', rda:375,   emoji:'🧲'},
  K:  {label:'Potasio',   unit:'mg', rda:2000,  emoji:'🍌'},
};
let RECIPES  = [];
let STOCK    = {};
let CHECKED  = {};
let ROUTINES = [];
let SCHEDULE = {};
let TRN_LOG  = {};
let TRN_LOG_HISTORY = {};  // all weeks keyed by week_key
let EX_LIBRARY = [];
let personalNotes = '';
let coachFeedback = '';
let publishedFeedback = '';
// Notas estructuradas del coach por cliente: {quickRules:'', supplements:'', personal:''}
const DEFAULT_QUICK_RULES = '• Agua 1,5–2 L/día mínimo\n• Suplementos según dieta\n• Horarios: consistencia > perfección\n• Creatina post-entreno';
const DEFAULT_SUPPLEMENTS = '• 2 Scoops proteína/día\n• Creatina con comida post-entreno';
let coachClientNotes = { quickRules: DEFAULT_QUICK_RULES, supplements: DEFAULT_SUPPLEMENTS, personal: '' };

function weekKey(){const d=new Date(),j=new Date(d.getFullYear(),0,4);const w=Math.ceil(((d-j)/86400000+j.getDay()+1)/7);return`${d.getFullYear()}-W${String(w).padStart(2,'0')}`;}
const THIS_WEEK = weekKey();
let currentSuperTab = 'all';
let currentRecipeId = null;
let currentRtnId    = null;
let currentDay      = null;  // day label selected in week bar (LUN,MAR...)
let currentExId     = null;
let trnTabMode      = 'week';

const MEAL_LABELS  = {desayuno:'🌅 Desayuno',comida:'🍽 Comida',preEntreno:'⚡ Pre-entreno',cena:'🌙 Cena',preCama:'🛌 Pre-cama'};
const MEALS_ORDER  = ['desayuno','comida','preEntreno','cena','preCama'];
const DAY_LABELS   = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];
const MUSCLES_LIST = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Piernas','Glúteos','Core','Cardio','Full Body'];

