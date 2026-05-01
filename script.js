// ============================================================
// app.js — Lógica do demo experimental da lavanderia kiosk
// ============================================================

const App = (() => {

  // ── Estado ────────────────────────────────────────────────
  let estado = {
    maquina:   null,   // { num: 1, ... }
    ciclo:     null,   // { nome, duracao, preco }
    metodo:    null,   // 'pix' | 'credito' | 'debito' | 'ficha'
    telaAtual: 1,
    progTimer: null,
    pixTimer:  null
  };

  // ── Init ──────────────────────────────────────────────────
  function init() {
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);
  }

  function atualizarRelogio() {
    const el = document.getElementById('relogio');
    if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Navegação ─────────────────────────────────────────────
  function irPara(num) {
    // Esconde tela atual
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));

    // Mostra nova tela
    const nova = document.getElementById(`tela-${num}`);
    if (nova) {
      nova.classList.add('ativa');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    estado.telaAtual = num;
    atualizarTrilha(num);
  }

  function atualizarTrilha(telaAtual) {
    document.querySelectorAll('.trilha-item').forEach(el => {
      const n = parseInt(el.dataset.step);
      el.classList.remove('ativa', 'concluida');
      if (n < telaAtual)  el.classList.add('concluida');
      if (n === telaAtual) el.classList.add('ativa');
    });

    // Linhas
    for (let i = 1; i <= 3; i++) {
      const linha = document.getElementById(`linha-${i}-${i+1}`);
      if (linha) linha.classList.toggle('ativa', i < telaAtual);
    }
  }

  // ── Tela 1: Máquinas ──────────────────────────────────────
  function selecionarMaquina(el, num) {
    // Remove seleção anterior
    document.querySelectorAll('.card-maquina.selecionada').forEach(c => c.classList.remove('selecionada'));

    // Seleciona nova
    el.classList.add('selecionada');
    estado.maquina = { num, nome: `Máquina ${String(num).padStart(2, '0')}` };

    // Libera botão
    document.getElementById('btn-para-ciclo').disabled = false;

    // Feedback visual
    mostrarToast(`Máquina ${String(num).padStart(2, '0')} selecionada!`);
  }

  function alertaIndisponivel() {
    mostrarToast('Esta máquina está em uso. Escolha outra!');
  }

  // ── Tela 2: Ciclos ────────────────────────────────────────
  function selecionarCiclo(el, nome, duracao, preco) {
    // Remove seleção anterior
    document.querySelectorAll('.card-ciclo.selecionado').forEach(c => c.classList.remove('selecionado'));

    // Seleciona
    el.classList.add('selecionado');
    estado.ciclo = { nome, duracao, preco };

    // Libera botão
    document.getElementById('btn-para-pag').disabled = false;

    // Atualiza subtítulo
    document.getElementById('sub-maquina').textContent =
      `${estado.maquina.nome} · Ciclo ${nome} selecionado`;

    mostrarToast(`${nome} — ${duracao} min · R$ ${preco.toFixed(2).replace('.', ',')}`);
  }

  // ── Tela 3: Pagamento ─────────────────────────────────────
  function selecionarMetodo(el, metodo) {
    // Remove seleção anterior
    document.querySelectorAll('.btn-metodo.selecionado').forEach(b => b.classList.remove('selecionado'));

    // Seleciona
    el.classList.add('selecionado');
    estado.metodo = metodo;

    // Preenche resumo
    document.getElementById('res-maq').textContent   = estado.maquina.nome;
    document.getElementById('res-ciclo').textContent  = estado.ciclo.nome;
    document.getElementById('res-dur').textContent    = `${estado.ciclo.duracao} min`;
    document.getElementById('res-total').textContent  = `R$ ${estado.ciclo.preco.toFixed(2).replace('.', ',')}`;

    // Mostra QR se PIX
    const pixArea = document.getElementById('pix-area');
    if (metodo === 'pix') {
      pixArea.classList.add('visivel');
      iniciarSimulacaoPix();
    } else {
      pixArea.classList.remove('visivel');
      if (estado.pixTimer) clearTimeout(estado.pixTimer);
    }

    // Libera botão de confirmar
    document.getElementById('btn-confirmar').disabled = false;
  }

  function iniciarSimulacaoPix() {
    // No modo demo, simula aprovação após 8 segundos
    if (estado.pixTimer) clearTimeout(estado.pixTimer);

    const statusEl = document.getElementById('pix-status-tag');
    statusEl.textContent = 'Aguardando pagamento...';
    statusEl.style.animation = '';

    estado.pixTimer = setTimeout(() => {
      statusEl.textContent = '✓ Pagamento aprovado!';
      statusEl.style.animation = 'none';
      statusEl.style.background = 'rgba(74,222,128,0.15)';
      statusEl.style.borderColor = 'rgba(74,222,128,0.4)';
      statusEl.style.color = '#4ade80';
      mostrarToast('PIX aprovado! Clique em "Confirmar e iniciar"');
    }, 8000);
  }

  // ── Confirmar e iniciar ───────────────────────────────────
  function confirmar() {
    if (!estado.maquina || !estado.ciclo || !estado.metodo) return;

    if (estado.pixTimer) clearTimeout(estado.pixTimer);

    // Preenche tela 4
    document.getElementById('lav-maq').textContent    = estado.maquina.nome;
    document.getElementById('lav-ciclo').textContent  = estado.ciclo.nome;

    const termino = new Date(Date.now() + estado.ciclo.duracao * 60000);
    document.getElementById('lav-termino').textContent = termino.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit'
    });

    irPara(4);
    iniciarProgresso(estado.ciclo.duracao);
  }

  function iniciarProgresso(duracaoMin) {
    if (estado.progTimer) clearInterval(estado.progTimer);

    const barra  = document.getElementById('prog-bar');
    const pct    = document.getElementById('prog-pct');
    const sub    = document.getElementById('lav-sub');
    const btnNova = document.getElementById('btn-nova');

    let progresso = 0;
    // No demo, cada segundo = 1% (100s para completar — mais rápido para demonstração)
    // Em produção, troque para: const passo = 100 / (duracaoMin * 60);
    const passo = 0.5; // demo acelerado

    estado.progTimer = setInterval(() => {
      progresso = Math.min(progresso + passo, 100);
      barra.style.width = progresso.toFixed(1) + '%';
      pct.textContent   = Math.round(progresso) + '%';

      const minRestantes = Math.ceil(((100 - progresso) / 100) * duracaoMin);
      if (progresso < 100) {
        sub.textContent = `Aprox. ${minRestantes} min restante${minRestantes !== 1 ? 's' : ''}`;
      } else {
        clearInterval(estado.progTimer);
        sub.textContent = 'Lavagem concluída! Retire sua roupa.';
        btnNova.style.display = 'inline-block';
        mostrarToast('Lavagem concluída!');
      }
    }, 200); // atualiza a cada 200ms no demo
  }

  // ── Reiniciar ─────────────────────────────────────────────
  function reiniciar() {
    if (estado.progTimer) clearInterval(estado.progTimer);
    if (estado.pixTimer)  clearTimeout(estado.pixTimer);

    // Reseta estado
    estado = { maquina: null, ciclo: null, metodo: null, telaAtual: 1, progTimer: null, pixTimer: null };

    // Reseta UI
    document.querySelectorAll('.card-maquina.selecionada').forEach(c => c.classList.remove('selecionada'));
    document.querySelectorAll('.card-ciclo.selecionado').forEach(c => c.classList.remove('selecionado'));
    document.querySelectorAll('.btn-metodo.selecionado').forEach(b => b.classList.remove('selecionado'));

    document.getElementById('btn-para-ciclo').disabled = true;
    document.getElementById('btn-para-pag').disabled   = true;
    document.getElementById('btn-confirmar').disabled  = true;
    document.getElementById('btn-nova').style.display  = 'none';

    document.getElementById('prog-bar').style.width = '0%';
    document.getElementById('prog-pct').textContent = '0%';

    document.getElementById('pix-area').classList.remove('visivel');

    const statusEl = document.getElementById('pix-status-tag');
    statusEl.textContent = 'Aguardando pagamento...';
    statusEl.style.cssText = '';

    irPara(1);
    mostrarToast('Nova sessão iniciada!');
  }

  // ── Toast ─────────────────────────────────────────────────
  let toastTimer;

  function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visivel'), 2800);
  }

  // ── Expor métodos públicos ─────────────────────────────────
  return {
    init,
    selecionarMaquina,
    alertaIndisponivel,
    selecionarCiclo,
    selecionarMetodo,
    confirmar,
    reiniciar,
    irPara
  };

})();

// Inicia quando a página carrega
document.addEventListener('DOMContentLoaded', App.init);