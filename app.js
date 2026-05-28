/**
 * Pesca Subaquática Inteligente - App JavaScript
 * @description Aplicativo de suporte para pesca subaquática inteligente
 * @author Adolfo Queiroz
 * @version 1.0
 */

// ========== CONFIGURAÇÕES ==========
/** @type {Object} Configurações globais da aplicação */
const CONFIG = {
  FIREBASE_DB_URL: 'https://pescasub-5967d-default-rtdb.firebaseio.com',
  FIREBASE_PATH: 'pescaSubApp',
  OPENMETEO_API: 'https://api.open-meteo.com/v1/forecast',
  API_TIMEOUT: 10000
};

// ========== STATE ==========
/** @type {number|null} Latitude atual */
let LAT = null;

/** @type {number|null} Longitude atual */
let LON = null;

/** @type {string} Cidade/região atual */
let CITY = 'Região Atual';

/** @type {number} Dia selecionado no forecast */
let selectedDay = 0;

/** @type {Object|null} Dados climáticos */
let weatherData = null;

/** @type {string} Aba ativa */
let currentTab = 'clima';

/** @type {Array} Registros de mergulho */
let diveLogs = JSON.parse(localStorage.getItem('diveLogs') || '[]');

/** @type {Object} Estado do checklist */
let checkState = JSON.parse(localStorage.getItem('checkState') || '{}');

/** @type {number|null} Índice do log sendo editado */
let editingLogIndex = null;

/** @type {boolean} Status de conexão Firebase */
let firebaseOnline = false;

// ========== DADOS ==========
/**
 * Array de peixes invasores
 * @type {Array<Object>}
 */
const PEIXES_INVASORES = [
  {
    emoji:'🐟',nome:'Tilápia',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Tilapia_oreochromis_niloticus_fish.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Tilapia_oreochromis_niloticus_fish.jpg',
    credit:'Raver Duane / USFWS',
    desc:'Espécie exótica comum em represas. A retirada ajuda no controle populacional.',
    sol:true,tags:['Exótica','Controle','Água parada']
  },
  {
    emoji:'🐠',nome:'Tucunaré',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Tucunar%C3%A9%20(Peacock%20Bass)%20(20750719960).jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Tucunar%C3%A9_(Peacock_Bass)_(20750719960).jpg',
    credit:'Under the same moon...',
    desc:'Predador introduzido. Caça melhor com sol, água clara e estrutura.',
    sol:true,tags:['Introduzido','Predador','Sol']
  },
  {
    emoji:'🐡',nome:'Pirarucu',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Arapaima-full.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Arapaima-full.jpg',
    credit:'Wikimedia Commons',
    desc:'Espécie amazônica. Onde aparece introduzida, confirme autorização e regra.',
    sol:false,tags:['Não nativo','Atenção legal','Grande porte']
  },
  {
    emoji:'🐟',nome:'Carpa',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Common_Carp_(Cyprinus_carpio)_(1)_(51222524826).jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Common_Carp_(Cyprinus_carpio)_(1)_(51222524826).jpg',
    credit:'Sam Stukel / USFWS',
    desc:'Exótico em lagos e reservatórios. Tolera água turva e pouca correnteza.',
    sol:false,tags:['Exótica','Reservatório','Água lenta']
  },
  {
    emoji:'🐠',nome:'Bagre-africano',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Clarias_gariepinus%2C_African_sharptooth_catfish.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Clarias_gariepinus,_African_sharptooth_catfish.jpg',
    credit:'Zahara5555',
    desc:'Invasor resistente, ocupa ambientes degradados. Verifique normas locais.',
    sol:false,tags:['Invasor','Resistente','Controle']
  }
];

/**
 * Array de peixes nativos
 * @type {Array<Object>}
 */
const PEIXES_NATIVOS = [
  {
    emoji:'🐟',nome:'Dourado',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Dourado(Salminus_brasiliensis)emBonito.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Dourado(Salminus_brasiliensis)emBonito.jpg',
    credit:'David Morimoto',
    desc:'Emblemático da bacia. Regras específicas de proteção, tamanho e período.',
    sol:true,tags:['Nativo','Predador','Consultar regra']
  },
  {
    emoji:'🐠',nome:'Pacu',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Pacu_Piaractus_2008_G1.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Pacu_Piaractus_2008_G1.jpg',
    credit:'George Chernilevsky',
    desc:'Grande importância ecológica, associado a frutos e áreas alagadas.',
    sol:false,tags:['Nativo','Frugívoro','Atenção legal']
  },
  {
    emoji:'🐡',nome:'Pintado',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Pescaria_de_pintado_no_pantanal.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Pescaria_de_pintado_no_pantanal.jpg',
    credit:'Wikimedia Commons',
    desc:'Bagre nativo de grande porte. Restrições por estado, época e tamanho.',
    sol:false,tags:['Nativo','Grande porte','Defeso']
  },
  {
    emoji:'🐟',nome:'Curimbatá',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Curimbat%C3%A1%20%E2%80%93%20Prochilodus_lineatus%20(5257755240).jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Curimbat%C3%A1_%E2%80%93_Prochilodus_lineatus_(5257755240).jpg',
    credit:'Wikimedia Commons',
    desc:'Migrador nativo, relevante para a cadeia alimentar. Protegido em piracema.',
    sol:true,tags:['Nativo','Migrador','Piracema']
  },
  {
    emoji:'🐠',nome:'Piraputanga',
    img:'https://commons.wikimedia.org/wiki/Special:FilePath/Brycon_hilarii_-_Piraputanga_no_Monumento_Natural_do_Rio_Formoso.jpg?width=900',
    source:'https://commons.wikimedia.org/wiki/File:Brycon_hilarii_-_Piraputanga_no_Monumento_Natural_do_Rio_Formoso.jpg',
    credit:'BRASIL AQUA',
    desc:'Águas claras e ambientes preservados. Tratar com cuidado e regra local.',
    sol:true,tags:['Nativo','Água clara','Preservação']
  }
];

/**
 * Array de itens do checklist
 * @type {Array<Object>}
 */
const CHECKLIST_ITEMS = [
  {id:'c1',cat:'Equipamento',text:'Espingarda / roupa verificada e funcional'},
  {id:'c2',cat:'Equipamento',text:'Máscara limpa, sem risco e vedação OK'},
  {id:'c3',cat:'Equipamento',text:'Nadadeiras sem trincas'},
  {id:'c4',cat:'Equipamento',text:'Boia de mergulho (bandeira) visível'},
  {id:'c5',cat:'Equipamento',text:'Arpão e pontas conferidos'},
  {id:'c6',cat:'Equipamento',text:'Faca de mergulho acessível'},
  {id:'c7',cat:'Segurança',text:'Parceiro de diving (buddy) definido'},
  {id:'c8',cat:'Segurança',text:'Informou onde e quando volta para alguém'},
  {id:'c9',cat:'Segurança',text:'Verificou condições climáticas e marés'},
  {id:'c10',cat:'Segurança',text:'Hidratado e descansado'},
  {id:'c11',cat:'Segurança',text:'Conhece a área e correntes locais'},
  {id:'c12',cat:'Legal',text:'Licença de pesca em mãos'},
  {id:'c13',cat:'Legal',text:'Verificou espécies permitidas e defeso'},
  {id:'c14',cat:'Legal',text:'Conferiu tamanho mínimo e cota diária'},
  {id:'c15',cat:'Emergência',text:'Celular carregado em embalagem estanque'},
  {id:'c16',cat:'Emergência',text:'Sabe o número do resgate local / SAMU 192'},
];

/**
 * Array de equipamentos
 * @type {Array<Object>}
 */
const EQUIPAMENTOS = [
  {icon:'🤿',nome:'Máscara',desc:'Volume interno baixo facilita equalização. Lente individual ou dupla; vedação de silicone.',badge:'Essencial',cls:'good'},
  {icon:'🦈',nome:'Roupa de neoprene',desc:'Proteção térmica e contra cortes. Espessura 3mm a 5mm dependendo da água.',badge:'Essencial',cls:'good'},
  {icon:'🏊',nome:'Nadadeiras',desc:'Longas e rígidas aumentam propulsão. Ajuste preciso para evitar câimbras.',badge:'Essencial',cls:'good'},
  {icon:'🎯',nome:'Espingarda / roupa',desc:'Pneumática, elástico ou de cano. Pesca de emboscada a longa distância.',badge:'Essencial',cls:'good'},
  {icon:'🦺',nome:'Roupa lastro',desc:'Cinturão e lastros: peso certo evita hiperventilação e síncope.',badge:'Segurança',cls:'medium'},
  {icon:'🚩',nome:'Boia e bandeira',desc:'Obrigatória. Sinaliza mergulhador para barcos. Cabo mínimo 5m.',badge:'Obrigatório',cls:'bad'},
  {icon:'🔪',nome:'Faca de mergulho',desc:'Corta linha, rede. Sempre acessível. Nunca use como arpão.',badge:'Segurança',cls:'medium'},
  {icon:'🐟',nome:'Bag de captura',desc:'Filete bag ou bag para peixes. Evita deixar presas soltas no cinturão.',badge:'Recomendado',cls:'info'},
  {icon:'📡',nome:'Computador / relógio',desc:'Cronometra apneias, marca profundidade máxima e intervalo de descanso.',badge:'Recomendado',cls:'info'},
];

/**
 * Array de sinais de mergulho
 * @type {Array<Object>}
 */
const SINAIS = [
  {icon:'👍',nome:'OK (superfície)',desc:'Polegar para cima: estou bem — use apenas em superfície.'},
  {icon:'🤙',nome:'OK (submerso)',desc:'OK circular com polegar e indicador: estou bem submerso.'},
  {icon:'✋',nome:'Para / Atenção',desc:'Mão aberta, palma para o parceiro: pare e observe.'},
  {icon:'👇',nome:'Descemos',desc:'Polegar apontando para baixo: vamos descer.'},
  {icon:'☝️',nome:'Subimos',desc:'Polegar apontando para cima (submerso): vamos subir.'},
  {icon:'🤏',nome:'Pouco ar / Frio',desc:'Mão comprimida: ar acabando / estou com frio.'},
  {icon:'✌️',nome:'Peixes / número 2',desc:'Dois dedos: indica peixe ou número dois.'},
  {icon:'🤜',nome:'Alerta / Urgente',desc:'Punho fechado agitado: situação urgente, venha imediatamente.'},
];

// ========== UTILITÁRIOS ==========
/**
 * Normaliza string removendo acentos
 * @param {string} v - Valor a normalizar
 * @returns {string} String normalizada
 */
function norm(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

/**
 * Converte estado para UF
 * @param {string} v - Nome do estado ou código
 * @returns {string} Código UF
 */
function stateToUF(v){
  const t=String(v||'').trim();
  if(/^[A-Z]{2}$/.test(t)) return t;
  const iso=t.match(/BR-([A-Z]{2})/i);
  if(iso) return iso[1].toUpperCase();
  const m={
    'acre':'AC','alagoas':'AL','amapa':'AP','amazonas':'AM','bahia':'BA',
    'ceara':'CE','distrito federal':'DF','espirito santo':'ES','goias':'GO',
    'maranhao':'MA','mato grosso':'MT','mato grosso do sul':'MS','minas gerais':'MG',
    'para':'PA','paraiba':'PB','parana':'PR','pernambuco':'PE','piaui':'PI',
    'rio de janeiro':'RJ','rio grande do norte':'RN','rio grande do sul':'RS',
    'rondonia':'RO','roraima':'RR','santa catarina':'SC','sao paulo':'SP',
    'sergipe':'SE','tocantins':'TO'
  };
  return m[norm(t)]||t;
}

/**
 * Formata nome da cidade com UF
 * @param {Object} addr - Objeto de endereço
 * @returns {string} Cidade formatada
 */
function formatCity(addr){
  addr=addr||{};
  const c=addr.city||addr.town||addr.village||addr.municipality||addr.county||'Região Atual';
  const uf=stateToUF(addr['ISO3166-2-lvl4']||addr.state_code||addr.state);
  return uf&&uf!==c?`${c}-${uf}`:c;
}

/**
 * Atualiza UI de localização com segurança
 * @param {string} name - Nome da localização
 * @param {string} coords - Coordenadas
 */
function setLocationUI(name,coords){
  const nameEl = document.getElementById('location-name');
  const coordsEl = document.getElementById('coords');
  
  if(nameEl) nameEl.textContent = name;
  if(coordsEl) coordsEl.textContent = coords || '---';
}

/**
 * Atualiza status do banco de dados com segurança
 * @param {string} text - Texto do status
 * @param {string} state - Estado (online/offline/error)
 */
function setDbStatus(text, state='offline'){
  const el = document.getElementById('db-status');
  if(!el) return;
  
  el.className = `db-status ${state}`;
  
  // Segurança: usar apenas textContent para dados do usuário
  const statusSpan = el.querySelector('span') || document.createElement('span');
  statusSpan.textContent = text;
  
  if(!el.querySelector('span')) {
    el.innerHTML = '';
    const icon = document.createElement('i');
    icon.className = 'ti ti-database';
    icon.setAttribute('aria-hidden', 'true');
    el.appendChild(icon);
    el.appendChild(statusSpan);
  }
}

// ========== FIREBASE ==========
/**
 * Gera URL Firebase com segurança
 * @param {string} path - Caminho
 * @returns {string} URL completa
 */
function firebaseUrl(path){
  return `${CONFIG.FIREBASE_DB_URL}/${CONFIG.FIREBASE_PATH}/${path}.json`;
}

/**
 * Lê dados do Firebase com tratamento de erros
 * @param {string} path - Caminho
 * @returns {Promise<Object>} Dados
 * @throws {Error} Erro ao ler Firebase
 */
async function firebaseRead(path){
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    const r = await fetch(firebaseUrl(path), { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if(!r.ok) throw new Error(`Erro Firebase: ${r.status}`);
    return r.json();
  } catch(error) {
    console.error('Erro ao ler Firebase:', error);
    setDbStatus('Erro de conexão', 'error');
    throw error;
  }
}

/**
 * Escreve dados no Firebase com tratamento de erros
 * @param {string} path - Caminho
 * @param {Object} data - Dados
 * @returns {Promise<Object>} Resposta
 * @throws {Error} Erro ao gravar
 */
async function firebaseWrite(path, data){
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    const r = await fetch(firebaseUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if(!r.ok) throw new Error(`Erro Firebase: ${r.status}`);
    return r.json();
  } catch(error) {
    console.error('Erro ao gravar Firebase:', error);
    setDbStatus('Erro de gravação', 'error');
    throw error;
  }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('city-input');
  const searchBtn = document.getElementById('search-btn');
  const gpsBtn = document.getElementById('gps-btn');
  
  if(searchBtn) searchBtn.addEventListener('click', searchCity);
  if(gpsBtn) gpsBtn.addEventListener('click', loadAll);
  if(cityInput) cityInput.addEventListener('keydown', e => {
    if(e.key === 'Enter') searchCity();
  });

  // Remover inline handlers e inicializar tabs
  initializeTabs();
  loadAll();
});

/**
 * Inicializa tabs com event listeners
 */
function initializeTabs(){
  const tabButtons = document.querySelectorAll('[data-tab]');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.dataset.tab;
      switchTab(tabName);
    });
  });
}

/**
 * Muda para uma aba específica
 * @param {string} tabName - Nome da aba
 */
function switchTab(tabName){
  // Atualizar buttons
  document.querySelectorAll('[data-tab]').forEach(btn => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
  
  currentTab = tabName;
}

/**
 * Busca cidade por nome
 */
async function searchCity(){
  const input = document.getElementById('city-input');
  if(!input) return;
  
  const cityName = input.value.trim();
  if(!cityName) {
    alert('Digite uma cidade');
    return;
  }
  
  try {
    // Implementar busca de cidade
    console.log('Buscando:', cityName);
  } catch(error) {
    console.error('Erro ao buscar cidade:', error);
  }
}

/**
 * Carrega todos os dados (GPS + clima)
 */
async function loadAll(){
  try {
    await getGPS();
    // await getWeather();
  } catch(error) {
    console.error('Erro ao carregar dados:', error);
  }
}

/**
 * Obtém coordenadas GPS com tratamento de erros
 */
async function getGPS(){
  if(!navigator.geolocation) {
    console.warn('Geolocalização não suportada');
    setLocationUI('Geolocalização indisponível', '---');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      LAT = pos.coords.latitude;
      LON = pos.coords.longitude;
      const coords = `${LAT.toFixed(4)}, ${LON.toFixed(4)}`;
      setLocationUI(CITY, coords);
    },
    (error) => {
      console.error('Erro GPS:', error.message);
      setLocationUI('GPS indisponível', '---');
    }
  );
}

// Placeholder para exportação de módulos se necessário
if(typeof module !== 'undefined' && module.exports){
  module.exports = {
    CONFIG,
    PEIXES_INVASORES,
    PEIXES_NATIVOS,
    CHECKLIST_ITEMS,
    EQUIPAMENTOS,
    SINAIS,
    norm,
    stateToUF,
    formatCity,
    setLocationUI,
    setDbStatus,
    firebaseRead,
    firebaseWrite,
    searchCity,
    loadAll
  };
}
