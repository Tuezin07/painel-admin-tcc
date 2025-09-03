document.addEventListener('DOMContentLoaded', function() {
  const elementos = {
    filtroAno: document.getElementById('ano'),
    filtroMes: document.getElementById('mes'),
    filtroSemana: document.getElementById('semana'),
    filtroDia: document.getElementById('dia'),
    btnFiltrar: document.getElementById('aplicar-filtro'),
    tabela: document.querySelector('#compras-table tbody'),
    totalCompras: document.getElementById('total-compras'),
    valorTotal: document.getElementById('valor-total')
  };

  inicializarFiltros();
  carregarDados();

  elementos.filtroAno.addEventListener('change', atualizarFiltros);
  elementos.filtroMes.addEventListener('change', atualizarFiltros);
  elementos.filtroSemana.addEventListener('change', atualizarFiltros);
  elementos.btnFiltrar.addEventListener('click', carregarDados);

  function inicializarFiltros() {
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual; i >= anoAtual - 5; i--) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      elementos.filtroAno.appendChild(option);
    }
    elementos.filtroMes.disabled = true;
    elementos.filtroSemana.disabled = true;
    elementos.filtroDia.disabled = true;
  }

  function atualizarFiltros() {
    if (this.id === 'ano') {
      elementos.filtroMes.disabled = !this.value;
      elementos.filtroSemana.disabled = true;
      elementos.filtroDia.disabled = true;
      if (this.value) preencherMeses(this.value);
    } else if (this.id === 'mes') {
      elementos.filtroSemana.disabled = !this.value;
      elementos.filtroDia.disabled = true;
      if (this.value) preencherSemanas(elementos.filtroAno.value, this.value);
    } else if (this.id === 'semana') {
      elementos.filtroDia.disabled = !this.value;
      if (this.value) preencherDias(elementos.filtroAno.value, elementos.filtroMes.value, this.value);
    }
  }

  function preencherMeses(ano) {
    elementos.filtroMes.innerHTML = '<option value="">Todos</option>';
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = new Date(ano, i-1, 1).toLocaleString('pt-BR', { month: 'long' });
      elementos.filtroMes.appendChild(option);
    }
  }

  function preencherSemanas(ano, mes) {
    elementos.filtroSemana.innerHTML = '<option value="">Todas</option>';
    const primeiroDia = new Date(ano, mes-1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    const semanasNoMes = Math.ceil((ultimoDia.getDate() + primeiroDia.getDay()) / 7);
    for (let i = 1; i <= semanasNoMes; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${i}ª semana`;
      elementos.filtroSemana.appendChild(option);
    }
  }

  function preencherDias(ano, mes, semana) {
    elementos.filtroDia.innerHTML = '<option value="">Todos</option>';
    const primeiroDia = new Date(ano, mes-1, 1);
    const inicioSemana = (semana-1)*7 - primeiroDia.getDay() + 1;
    for (let i=0; i<7; i++) {
      const dia = inicioSemana+i;
      if(dia>0 && dia<=new Date(ano, mes,0).getDate()){
        const option = document.createElement('option');
        option.value = dia;
        option.textContent = dia.toString().padStart(2,'0');
        elementos.filtroDia.appendChild(option);
      }
    }
  }

  async function carregarDados() {
    const filtros = {
      ano: elementos.filtroAno.value,
      mes: elementos.filtroMes.value,
      semana: elementos.filtroSemana.value,
      dia: elementos.filtroDia.value
    };
    const params = new URLSearchParams();
    for (const key in filtros) if(filtros[key]) params.append(key,filtros[key]);

    try {
      const res = await fetch(`/api/compras?${params.toString()}`, {
        credentials: 'same-origin' // ESSENCIAL: envia cookies da sessão
      });

      if(res.status === 401) {
        // Se não logado, redireciona pro login
        window.location.href = '/';
        return;
      }

      if(!res.ok) throw new Error('Erro ao carregar dados');

      const data = await res.json();
      atualizarTabela(data.compras);
      atualizarResumo(data.total_compras, data.valor_total);
    } catch(e) {
      console.error(e);
      alert('Ocorreu um erro ao carregar os dados. Tente novamente.');
    }
  }

  function atualizarTabela(compras){
    elementos.tabela.innerHTML = '';
    if(compras.length===0){
      elementos.tabela.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhuma compra encontrada</td></tr>';
      return;
    }
    compras.forEach(c=>{
      const row = document.createElement('tr');
      row.innerHTML = `<td>${c.id}</td>
                       <td>${formatarData(c.data)} ${formatarHora(c.data)}</td>
                       <td>R$ ${formatarValor(c.valor_total)}</td>`;
      elementos.tabela.appendChild(row);
    });
  }

  function atualizarResumo(total, valor){
    elementos.totalCompras.textContent = total||'0';
    elementos.valorTotal.textContent = `R$ ${formatarValor(valor||0)}`;
  }

  // Formatação
  function formatarData(dataString){
    return new Date(dataString).toLocaleDateString('pt-BR');
  }

  function formatarHora(dataString){
    return new Date(dataString).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  }

  function formatarValor(valor){
    return parseFloat(valor||0).toFixed(2).replace('.', ',');
  }
});
