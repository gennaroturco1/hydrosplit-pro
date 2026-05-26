let currentActiveUnitData = [];
let totalUserNodesCount = 0; 

window.onload = function() {
    initializeDefaultCondominiumState();
    setupItemizerListeners();
};

function initializeDefaultCondominiumState() {
    const dynamicContainer = document.getElementById('dynamicNodeContainer');
    if (!dynamicContainer) return;
    
    dynamicContainer.innerHTML = '';
    totalUserNodesCount = 0;
    buildFallbackNodes();
}

function buildFallbackNodes() {
    for (let i = 1; i <= 3; i++) {
        window.addNewUserNode();
    }
}

window.addNewUserNode = function() {
    const container = document.getElementById('dynamicNodeContainer');
    if (!container) return;
    
    totalUserNodesCount++;
    
    const nodeRow = document.createElement('div');
    nodeRow.className = 'node-row-card';
    nodeRow.id = `userNodeRow_u${totalUserNodesCount}`;
    nodeRow.innerHTML = `
        <div class="node-identity">
            <div class="node-avatar avatar-generic">U${totalUserNodesCount}</div>
            <input type="text" id="u${totalUserNodesCount}Name" placeholder="Inquilino ${totalUserNodesCount}" value="">
        </div>
        <input type="number" id="u${totalUserNodesCount}Prev" placeholder="Precedente (m³)" class="meter-input input-condo-reading">
        <input type="number" id="u${totalUserNodesCount}Curr" placeholder="Attuale (m³)" class="meter-input input-condo-reading">
    `;
    container.appendChild(nodeRow);
};

window.removeLastUserNode = function() {
    if (totalUserNodesCount <= 1) {
        openMagicModal({
            title: "Azione Non Consentita",
            description: "Impossibile rimuovere l'utente. Il sistema richiede la presenza di almeno un'utenza attiva per poter elaborare la matrice di riparto delle spese idriche.",
            btnGradient: "linear-gradient(135deg, #f43f5e, #be123c)",
            icon: "⚠️",
            bgIcon: "rgba(244, 63, 94, 0.1)",
            borderIcon: "rgba(244, 63, 94, 0.2)",
            buttons: [{ text: "Ho Capito", type: "primary", action: null }]
        });
        return;
    }
    const lastRow = document.getElementById(`userNodeRow_u${totalUserNodesCount}`);
    if (lastRow) {
        lastRow.remove();
        totalUserNodesCount--;
    }
};

function setupItemizerListeners() {
    const rawInputs = document.querySelectorAll('.bill-raw-input');
    rawInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.parentElement.classList.remove('flash-error');
            
            let imponibileSum = 0;
            let fuoriIVASum = 0;

            rawInputs.forEach(i => {
                const val = parseFloat(i.value) || 0;
                const type = i.getAttribute('data-type');
                if (type === 'equal_no_tax') fuoriIVASum += val;   
                else if (type === 'equal' || type === 'proportional') imponibileSum += val; 
            });

            const calcolatoIVA = imponibileSum * 0.10;
            const totaleComplessivo = imponibileSum + calcolatoIVA + fuoriIVASum;

            const boxes = ['box_imponibileChassis', 'box_ivaChassis', 'mainTotalBoxChassis'];
            if (totaleComplessivo > 0) {
                boxes.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.classList.add('active-computed');
                });
                document.getElementById('mainTotalCurrency').style.color = '#22d3ee';
                document.getElementById('mainTotalLabel').style.color = '#22d3ee';
            } else {
                boxes.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.classList.remove('active-computed');
                });
                document.getElementById('mainTotalCurrency').style.color = '#334155';
                document.getElementById('mainTotalLabel').style.color = '';
            }

            document.getElementById('calcImponibile').value = imponibileSum > 0 ? imponibileSum.toFixed(2) : "";
            document.getElementById('calcIVA').value = calcolatoIVA > 0 ? calcolatoIVA.toFixed(2) : "";
            document.getElementById('totalBill').value = totaleComplessivo > 0 ? totaleComplessivo.toFixed(2) : "";
        });
    });
}

window.calculateSplit = function() {
    const totalBill = parseFloat(document.getElementById('totalBill').value) || 0;
    let hasErrors = false;

    const rawInputs = document.querySelectorAll('.bill-raw-input');
    let totalBillFieldsFilled = 0;
    rawInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        if (val > 0) {
            totalBillFieldsFilled++;
            input.parentElement.classList.remove('flash-error');
        }
    });

    if (totalBill === 0 || totalBillFieldsFilled === 0) {
        hasErrors = true;
        rawInputs.forEach(input => {
            if ((parseFloat(input.value) || 0) === 0) {
                input.parentElement.classList.add('flash-error');
            }
        });
    }

    for (let i = 1; i <= totalUserNodesCount; i++) {
        const prevVal = document.getElementById(`u${i}Prev`).value;
        const currVal = document.getElementById(`u${i}Curr`).value;
        if (prevVal === "" || currVal === "") {
            hasErrors = true;
            document.getElementById(`userNodeRow_u${i}`).classList.add('flash-error');
        } else {
            document.getElementById(`userNodeRow_u${i}`).classList.remove('flash-error');
        }
    }

    if (hasErrors) {
        openMagicModal({
            title: "Campi Obbligatori Mancanti",
            description: "Compila tutte le voci prima di elaborare la ripartizione.",
            btnGradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            icon: "📋",
            bgIcon: "rgba(14, 165, 233, 0.1)",
            borderIcon: "rgba(14, 165, 233, 0.2)",
            buttons: [{ text: "Rivedi Campi", type: "primary", action: null }]
        });
        return;
    }

    rawInputs.forEach(input => input.parentElement.classList.remove('flash-error'));

    let units = [];
    for (let i = 1; i <= totalUserNodesCount; i++) {
        const customNameInput = document.getElementById(`u${i}Name`);
        const unitLabel = customNameInput && customNameInput.value.trim() !== "" ? customNameInput.value.trim() : `Unità ${i}`;
        const prev = parseFloat(document.getElementById(`u${i}Prev`).value) || 0;
        const curr = parseFloat(document.getElementById(`u${i}Curr`).value) || 0;
        const consumption = Math.max(0, curr - prev);

        units.push({
            name: unitLabel, prev: prev, curr: curr, cons: consumption,
            share: 0, fixedOwed: 0, varOwed: 0, totalOwed: 0, id: `u${i}`
        });
    }

    const totalSubConsumption = units.reduce((sum, unit) => sum + unit.cons, 0);

    let totaleFissiImponibile = 0;
    let totaleFissiFuoriIVA = 0;
    let totaleVariabiliImponibile = 0;

    rawInputs.forEach(i => {
        const val = parseFloat(i.value) || 0;
        const type = i.getAttribute('data-type');
        if (type === 'equal_no_tax') totaleFissiFuoriIVA += val;
        else if (type === 'equal') totaleFissiImponibile += val;
        else if (type === 'proportional') totaleVariabiliImponibile += val;
    });

    const fixedIVA = totaleFissiImponibile * 0.10;
    const totaleFissiFinito = totaleFissiImponibile + fixedIVA + totaleFissiFuoriIVA;
    const quotaFissaPerInquilino = totaleFissiFinito / totalUserNodesCount;

    const variableIVA = totaleVariabiliImponibile * 0.10;
    const totaleVariabiliFinito = totaleVariabiliImponibile + variableIVA;

    units.forEach(unit => {
        unit.share = totalSubConsumption > 0 ? (unit.cons / totalSubConsumption) : 0;
        unit.fixedOwed = quotaFissaPerInquilino;
        unit.varOwed = totaleVariabiliFinito * unit.share;
        unit.totalOwed = unit.fixedOwed + unit.varOwed;
    });

    // Aggiorna la memoria globale dei dati utente per i tab interattivi
    currentActiveUnitData = units;

    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    units.forEach(unit => {
        tableBody.innerHTML += `
            <tr>
                <td style="font-weight: 700; color: #ffffff; padding: 16px;">${unit.name}</td>
                <td style="font-weight: 600; padding: 16px;">${unit.cons.toFixed(2)} m³</td>
                <td style="color: #94a3b8; padding: 16px;">${(unit.share * 100).toFixed(1)}%</td>
                <td style="color: #cbd5e1; padding: 16px; white-space: nowrap;">€&nbsp;${unit.fixedOwed.toFixed(2)}</td>
                <td style="color: #94a3b8; padding: 16px; white-space: nowrap;">€&nbsp;${unit.varOwed.toFixed(2)}</td>
                <td style="text-align: right; padding-right: 24px; font-weight: 800; color: #22d3ee; padding: 16px; white-space: nowrap;">€&nbsp;${unit.totalOwed.toFixed(2)}</td>
            </tr>
        `;
    });

    tableBody.innerHTML += `
        <tr class="summary-detail-row" style="background: rgba(15, 23, 42, 0.4); border-top: 2px solid rgba(255,255,255,0.05);">
            <td colspan="3" style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 12px 16px;">Totale Spese a Divisione Uguale (Fisse):</td>
            <td style="font-weight: 700; color: #94a3b8; padding: 12px 16px; white-space: nowrap;">€&nbsp;${totaleFissiFinito.toFixed(2)}</td>
            <td colspan="2" style="color: #475569; font-size: 11px; padding: 12px 16px;">(Suddiviso tra ${totalUserNodesCount} utenti in quote da €&nbsp;${quotaFissaPerInquilino.toFixed(2)})</td>
        </tr>
        <tr class="summary-detail-row" style="background: rgba(15, 23, 42, 0.4);">
            <td colspan="4" style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 12px 16px;">Totale Spese a Consumo Proporzionale (m³ totali: ${totalSubConsumption.toFixed(2)}):</td>
            <td style="font-weight: 700; color: #94a3b8; padding: 12px 16px; white-space: nowrap;">€&nbsp;${totaleVariabiliFinito.toFixed(2)}</td>
            <td style="text-align: right; padding-right: 24px; font-weight: 900; color: #ffffff; padding: 12px 16px; white-space: nowrap; font-size: 14px;">€&nbsp;${totalBill.toFixed(2)}</td>
        </tr>
    `;

    const printHeaderContainer = document.getElementById('printOnlyInvoiceHeader');
    let fixedItemsHTML = "";
    let propItemsHTML = "";

    rawInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        const labelElement = document.getElementById(input.id.replace('bill_', 'lbl_'));
        const labelText = labelElement ? labelElement.innerText : "Voce Spesa";
        const type = input.getAttribute('data-type');

        const rowTemplate = `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px 0; font-size: 8.5pt; color: #334155; font-weight: 600;">${labelText}</td>
                <td style="padding: 4px 0; font-size: 8.5pt; color: #0f172a; font-weight: 700; text-align: right; white-space: nowrap;">€&nbsp;${val.toFixed(2)}</td>
            </tr>
        `;
        if (type === "equal" || type === "equal_no_tax") fixedItemsHTML += rowTemplate;
        else if (val > 0) propItemsHTML += rowTemplate;
    });

    // 🔧 FIX EFFETTUATO QUI: Utilizzate le variabili corrette per l'HTML di stampa
    let calcolatoImponibileTotale = totaleFissiImponibile + totaleVariabiliImponibile;
    let calcolataIvaTotale = fixedIVA + variableIVA;

    printHeaderContainer.innerHTML = `
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 15px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td>
                        <div style="font-size: 18pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em;">Prospetto Riparto Spese</div>
                        <div style="font-size: 9pt; color: #0ea5e9; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">Servizio Idrico Condominiale</div>
                    </td>
                    <td style="text-align: right; color: #475569; font-size: 8.5pt; line-height: 1.4; vertical-align: bottom;">
                        <strong>Ubicazione:</strong> Via Ovidio 6, Aversa (CE)<br>
                        <strong>Ente Gestore:</strong> Idrico Terra di Lavoro S.p.A.<br>
                        <strong>Numero Utenze:</strong> ${totalUserNodesCount} Condomini
                    </td>
                </tr>
            </table>
        </div>
        <h3 style="font-size: 10pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; border-left: 4px solid #0ea5e9; padding-left: 6px;">1. COSA DEVO PAGARE? (Sintesi Globale)</h3>
        <div style="display: table; width: 100%; table-layout: fixed; margin-bottom: 15px;">
            <div style="display: table-cell; width: 25%; padding-right: 4px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Totale Imponibile</div>
                    <div style="font-size: 12pt; font-weight: 800; color: #0f172a; white-space: nowrap;">€&nbsp;${calcolatoImponibileTotale.toFixed(2)}</div>
                </div>
            </div>
            <div style="display: table-cell; width: 25%; padding: 0 4px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
                    <div style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Totale IVA (10%)</div>
                    <div style="font-size: 12pt; font-weight: 800; color: #475569; white-space: nowrap;">€&nbsp;${calcolataIvaTotale.toFixed(2)}</div>
                </div>
            </div>
            <div style="display: table-cell; width: 50%; padding-left: 4px;">
                <div style="background: linear-gradient(135deg, #f0fdfa, #ccfbf1); border: 1px solid #99f6e4; border-radius: 6px; padding: 6px;">
                    <div style="font-size: 7.5pt; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-bottom: 2px;">Totale Preavviso di Fatturazione</div>
                    <div style="font-size: 13pt; font-weight: 900; color: #115e59; white-space: nowrap;">€&nbsp;${totalBill.toFixed(2)}</div>
                </div>
            </div>
        </div>
        <div style="display: table; width: 100%; table-layout: fixed; margin-bottom: 15px;">
            <div style="display: table-cell; width: 50%; padding-right: 8px; vertical-align: top;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                    <div style="font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>Quote Fisse Ripartite</span>
                        <span style="color: #0f172a;">Tot: €&nbsp;${totaleFissiFinito.toFixed(2)}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">${fixedItemsHTML}</table>
                </div>
            </div>
            <div style="display: table-cell; width: 50%; padding-left: 8px; vertical-align: top;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                    <div style="font-size: 7.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>Quota Consumi Effettivi</span>
                        <span style="color: #0f172a;">Tot: €&nbsp;${totaleVariabiliFinito.toFixed(2)}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">${propItemsHTML}</table>
                </div>
            </div>
        </div>
    `;

    const tabHeadersContainer = document.getElementById('magicTabHeaders');
    tabHeadersContainer.innerHTML = '';
    units.forEach(unit => {
        const tabBtn = document.createElement('button');
        tabBtn.innerText = unit.name;
        tabBtn.id = `tabHeaderBtn_${unit.id}`;
        tabBtn.style.cssText = `background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 13px; padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: 4px;`;
        tabBtn.onclick = () => renderActiveTabContent(unit.id);
        tabHeadersContainer.appendChild(tabBtn);
    });
    renderActiveTabContent(units[0].id);

    const printContainer = document.getElementById('printOnlyAuditContainer');
    printContainer.innerHTML = `
        <h3 style="font-size: 10pt; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; border-left: 4px solid #0ea5e9; padding-left: 6px; margin-top: 15px; page-break-after: avoid;">
            3. Trasparenza Audit Contatori Individuali
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 5px;">
            ${units.map(u => `
                <div class="print-audit-card-wrap" style="width: calc(33.333% - 8px); box-sizing: border-box;">
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #ffffff;">
                        <h4 style="font-size: 9.5pt; font-weight: 800; color: #0f172a; margin-bottom: 6px; border-bottom: 2px solid #0ea5e9; padding-bottom: 2px; text-transform: uppercase;">${u.name}</h4>
                        <div style="margin-bottom: 4px;"><span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Letture:</span><br><span style="font-size: 9pt; font-weight: 600; color: #1e293b;">${u.prev.toFixed(2)} ➔ ${u.curr.toFixed(2)} m³</span></div>
                        <div style="margin-bottom: 4px;"><span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Consumo Netto:</span><br><span style="font-size: 9pt; font-weight: 700; color: #0ea5e9;">${u.cons.toFixed(2)} m³</span></div>
                        <div style="margin-bottom: 4px;"><span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Quota Fissa (1/${totalUserNodesCount}):</span><br><span style="font-size: 9pt; font-weight: 600; color: #1e293b; white-space: nowrap;">€&nbsp;${u.fixedOwed.toFixed(2)}</span></div>
                        <div style="margin-bottom: 4px;"><span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Quota Consumo:</span><br><span style="font-size: 9pt; font-weight: 600; color: #1e293b; white-space: nowrap;">€&nbsp;${u.varOwed.toFixed(2)}</span></div>
                        <div style="border-top: 1px dashed #e2e8f0; padding-top: 6px; margin-top: 6px; text-align: right;"><span style="font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Totale Dovuto:</span><br><span style="font-size: 11pt; font-weight: 800; color: #0ea5e9; white-space: nowrap;">€&nbsp;${u.totalOwed.toFixed(2)}</span></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('resultsCard').style.display = 'block';
    executeAutomaticRolloverStorage(units, totaleFissiImponibile);
};

function renderActiveTabContent(unitId) {
    const targetUnit = currentActiveUnitData.find(u => u.id === unitId);
    if (!targetUnit) return;
    currentActiveUnitData.forEach(u => { const btn = document.getElementById(`tabHeaderBtn_${u.id}`); if (btn) { btn.style.color = "#64748b"; btn.style.borderBottomColor = "transparent"; } });
    const activeBtn = document.getElementById(`tabHeaderBtn_${unitId}`); if (activeBtn) { activeBtn.style.color = "#22d3ee"; activeBtn.style.borderBottomColor = "#22d3ee"; }

    document.getElementById('magicTabContent').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 13px; color: #cbd5e1; margin-top: 10px;">
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;"><p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Intervallo Letture Sotto-Contatore</p><p style="font-weight: bold; color: #ffffff; font-size: 14px;">${targetUnit.prev.toFixed(2)} m³ ➔ ${targetUnit.curr.toFixed(2)} m³</p></div>
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;"><p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Consumo Netto Rilevato</p><p style="font-weight: bold; color: #22d3ee; font-size: 14px;">${targetUnit.cons.toFixed(2)} m³ <span style="color: #64748b; font-size: 11px; font-weight: normal;">(${(targetUnit.share * 100).toFixed(1)}%)</span></p></div>
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;"><p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Quota Spese Fisse Co-Divisa</p><p style="font-weight: bold; color: #ffffff; font-size: 14px; white-space: nowrap;">€&nbsp;${targetUnit.fixedOwed.toFixed(2)}</p></div>
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;"><p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Quota Consumo Proporzionale</p><p style="font-weight: bold; color: #ffffff; font-size: 14px; white-space: nowrap;">€&nbsp;${targetUnit.varOwed.toFixed(2)}</p></div>
        </div>
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 12px; font-weight: 700; color: #94a3b8;">Importo Effettivo da Pagare:</span><span style="font-size: 18px; font-weight: 900; color: #22d3ee; white-space: nowrap;">€&nbsp;${targetUnit.totalOwed.toFixed(2)}</span></div>
    `;
}

window.generatePrintPDF = function() {
    window.print();
};

function executeAutomaticRolloverStorage(units, totalFixed) {
    const itemsData = {}; document.querySelectorAll('.bill-raw-input').forEach(i => { itemsData[i.id] = i.value; });
    const dataToSave = { 
        totalFixed: totalFixed, 
        totalUsers: totalUserNodesCount, 
        itemsData: itemsData, 
        units: units.map(u => ({ id: u.id, name: u.name, prev: u.curr, curr: "" })) 
    };
    localStorage.setItem('hydrosplit_pro_condo_v15_data', JSON.stringify(dataToSave));
}

function loadSavedData(savedString) {
    const data = JSON.parse(savedString);
    const targetCount = data.totalUsers || 3;
    for (let i = 1; i <= targetCount; i++) {
        window.addNewUserNode();
    }
    if(data.itemsData) { for(let id in data.itemsData) { if(document.getElementById(id)) document.getElementById(id).value = data.itemsData[id]; } }
    data.units.forEach(u => {
        const idxNum = u.id.replace('u', '');
        if(document.getElementById(`u${idxNum}Name`)) document.getElementById(`u${idxNum}Name`).value = u.name;
        if(document.getElementById(`u${idxNum}Prev`)) document.getElementById(`u${idxNum}Prev`).value = u.prev;
        if(document.getElementById(`u${idxNum}Curr`)) document.getElementById(`u${idxNum}Curr`).value = u.curr;
    });
}

function openMagicModal(options) {
    const modal = document.getElementById('customModal');
    const card = document.getElementById('modalCard');
    if (!modal || !card) return;
    
    document.getElementById('modalTitle').innerText = options.title;
    document.getElementById('modalDescription').innerText = options.description;
    
    const iconContainer = document.getElementById('modalIconContainer');
    iconContainer.style.backgroundColor = options.bgIcon;
    iconContainer.style.border = `1px solid ${options.borderIcon}`;
    iconContainer.innerText = options.icon;
    
    const actionsContainer = document.getElementById('modalActions');
    actionsContainer.innerHTML = '';
    
    options.buttons.forEach(btn => {
        const button = document.createElement('button');
        button.innerText = btn.text;
        button.style.cssText = `padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; border: none;`;
        if (btn.type === "primary") {
            button.style.background = options.btnGradient;
            button.style.color = '#ffffff';
        } else {
            button.style.background = '#1e293b';
            button.style.color = '#94a3b8';
            button.style.border = '1px solid rgba(255,255,255,0.05)';
        }
        button.onclick = () => {
            modal.classList.remove('modal-active');
            if (btn.action) btn.action();
        };
        actionsContainer.appendChild(button);
    });
    
    modal.classList.add('modal-active');
}

window.resetApplicationState = function() { 
    openMagicModal({ 
        title: "Azzera la Matrice?", 
        description: "Questo cancellerà tutti i dati inseriti e ripristinerà lo stato iniziale a 3 inquilini di fabbrica.", 
        btnGradient: "linear-gradient(135deg, #f43f5e, #be123c)", 
        icon: "🚨",
        bgIcon: "rgba(244, 63, 94, 0.1)",
        borderIcon: "rgba(244, 63, 94, 0.2)",
        buttons: [
            { text: "Annulla", type: "secondary", action: null }, 
            { text: "Resetta Tutto", type: "primary", action: executeResetLogic }
        ] 
    }); 
};

function executeResetLogic() { 
    initializeDefaultCondominiumState(); 
    document.getElementById('calcImponibile').value = ""; 
    document.getElementById('calcIVA').value = ""; 
    document.getElementById('totalBill').value = ""; 
    document.querySelectorAll('.bill-raw-input').forEach(i => i.value = ""); 
    
    ['box_imponibileChassis', 'box_ivaChassis', 'mainTotalBoxChassis'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.remove('active-computed');
    });
    document.getElementById('mainTotalCurrency').style.color = '#334155';
    document.getElementById('mainTotalLabel').style.color = '';

    document.getElementById('tableBody').innerHTML = ''; 
    document.getElementById('resultsCard').style.display = 'none'; 
}