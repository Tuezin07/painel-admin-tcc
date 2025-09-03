document.addEventListener('DOMContentLoaded', function() {
  // Elementos da interface
  const elementos = {
    filtroAno: document.getElementById('ano'),
    filtroMes: document.getElementById('mes'),
    filtroSemana: document.getElementById('semana'),
    filtroDia: document.getElementById('dia'),
    btnFiltrar: document.getElementById('aplicar-filtro'),
    tabela: document.querySelector('#compras-table tbody'),
    totalCompras: document.getElementById('total-compras'),
    valorTotal: document.getElementById('valor-total'),
    loadingIndicator: document.createElement('div')
  };

  // Configura o indicador de carregamento
  elementos.loadingIndicator.className = 'loading-indicator';
  elementos.loadingIndicator.innerHTML = '<div class="spinner"></div><p>Carregando dados...</p>';

  // Inicializa os filtros
  inicializarFiltros();

  // Carrega os dados iniciais
  carregarDados();

  // Event listeners
  elementos.filtroAno.addEventListener('change', atualizarFiltros);
  elementos.filtroMes.addEventListener('change', atualizarFiltros);
  elementos.filtroSemana.addEventListener('change', atualizarFiltros);
  elementos.btnFiltrar.addEventListener('click', carregarDados);

  function inicializarFiltros() {
    // Preenche anos (últimos 5 anos)
    const anoAtual = new Date().getFullYear();
    for (let i = anoAtual; i >= anoAtual - 5; i--) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      elementos.filtroAno.appendChild(option);
    }
    
    // Desabilita filtros dependentes inicialmente
    elementos.filtroMes.disabled = true;
    elementos.filtroSemana.disabled = true;
    elementos.filtroDia.disabled = true;
  }

  function atualizarFiltros() {
    // Limpa filtros dependentes
    if (this.id === 'ano') {
      elementos.filtroMes.innerHTML = '<option value="">Selecione</option>';
      elementos.filtroSemana.innerHTML = '<option value="">Selecione</option>';
      elementos.filtroDia.innerHTML = '<option value="">Selecione</option>';
      
      if (this.value) {
        preencherMeses(this.value);
        elementos.filtroMes.disabled = false;
      } else {
        elementos.filtroMes.disabled = true;
        elementos.filtroSemana.disabled = true;
        elementos.filtroDia.disabled = true;
      }
    } 
    else if (this.id === 'mes') {
      elementos.filtroSemana.innerHTML = '<option value="">Selecione</option>';
      elementos.filtroDia.innerHTML = '<option value="">Selecione</option>';
      
      if (this.value && elementos.filtroAno.value) {
        preencherSemanas(elementos.filtroAno.value, this.value);
        elementos.filtroSemana.disabled = false;
      } else {
        elementos.filtroSemana.disabled = true;
        elementos.filtroDia.disabled = true;
      }
    }
    else if (this.id === 'semana') {
      elementos.filtroDia.innerHTML = '<option value="">Selecione</option>';
      
      if (this.value && elementos.filtroMes.value && elementos.filtroAno.value) {
        preencherDias(elementos.filtroAno.value, elementos.filtroMes.value, this.value);
        elementos.filtroDia.disabled = false;
      } else {
        elementos.filtroDia.disabled = true;
      }
    }
  }

  function preencherMeses(ano) {
    elementos.filtroMes.innerHTML = '<option value="">Todos</option>';
    
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = new Date(ano, i - 1, 1).toLocaleString('pt-BR', { month: 'long' });
      elementos.filtroMes.appendChild(option);
    }
  }

  function preencherSemanas(ano, mes) {
    elementos.filtroSemana.innerHTML = '<option value="">Todas</option>';
    
    const primeiroDia = new Date(ano, mes - 1, 1);
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
    
    const primeiroDia = new Date(ano, mes - 1, 1);
    const inicioSemana = (semana - 1) * 7 - primeiroDia.getDay() + 1;
    
    for (let i = 0; i < 7; i++) {
      const dia = inicioSemana + i;
      if (dia > 0 && dia <= new Date(ano, mes, 0).getDate()) {
        const option = document.createElement('option');
        option.value = dia;
        option.textContent = `${dia.toString().padStart(2, '0')}`;
        elementos.filtroDia.appendChild(option);
      }
    }
  }

  async function carregarDados() {
    try {
      // Mostra indicador de carregamento
      elementos.tabela.parentNode.insertBefore(elementos.loadingIndicator, elementos.tabela);
      elementos.tabela.style.display = 'none';
      
      // Obtém valores dos filtros
      const filtros = {
        ano: elementos.filtroAno.value,
        mes: elementos.filtroMes.value,
        semana: elementos.filtroSemana.value,
        dia: elementos.filtroDia.value
      };
      
      // Monta URL da API
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filtros)) {
        if (value) params.append(key, value);
      }
      
      // Faz a requisição
      const response = await fetch(`/api/compras?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      
      const data = await response.json();
      
      // Atualiza a interface
      atualizarTabela(data.compras);
      atualizarResumo(data.total_compras, data.valor_total);
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
    } finally {
      // Remove indicador de carregamento
      if (elementos.loadingIndicator.parentNode) {
        elementos.loadingIndicator.parentNode.removeChild(elementos.loadingIndicator);
      }
      elementos.tabela.style.display = '';
    }
  }

  function atualizarTabela(compras) {
    elementos.tabela.innerHTML = '';
    
    if (compras.length === 0) {
      elementos.tabela.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 20px;">
            Nenhuma compra encontrada com os filtros selecionados
          </td>
        </tr>
      `;
      return;
    }
    
    compras.forEach(compra => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${compra.id}</td>
        <td>
          <div class="data-bonita">
            <span class="data">${formatarData(compra.data)}</span>
            <span class="hora">${formatarHora(compra.data)}</span>
          </div>
        </td>
        <td>R$ ${formatarValor(compra.valor_total)}</td>
      `;
      elementos.tabela.appendChild(row);
    });
  }

  function atualizarResumo(totalCompras, valorTotal) {
    elementos.totalCompras.textContent = totalCompras || '0';
    elementos.valorTotal.textContent = `R$ ${formatarValor(valorTotal)}`;
  }

  // Funções auxiliares de formatação
  function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  }

  function formatarHora(dataString) {
    const data = new Date(dataString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatarValor(valor) {
    return parseFloat(valor || 0).toFixed(2).replace('.', ',');
  }
});