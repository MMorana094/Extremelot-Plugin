
/*
PLUGIN Dastian - 07 Agosto 2025 
In costruzione - basato su Script di Lugantes
Da sistemare i commenti e l'impaginazione per rendere il file leggibile
*/

/*************************************************/
/*                DEBUG MODE INIT                */
/*************************************************/
let DEBUG_MODE = false;

// controlla che lo storage sia disponibile
if (chrome?.storage?.local) {
  // Leggi lo stato salvato
  chrome.storage.local.get("DEBUG_MODE", (data) => {
    DEBUG_MODE = Boolean(data.DEBUG_MODE);
    debugLog("DEBUG_MODE iniziale:", DEBUG_MODE);
  });

  // Aggiornati in tempo reale
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.DEBUG_MODE) {
      DEBUG_MODE = changes.DEBUG_MODE.newValue;
      debugLog("DEBUG_MODE aggiornato:", DEBUG_MODE);
    }
  });
} else {
  console.warn("chrome.storage.local non disponibile in questo contesto");
}

// Funzione centralizzata per log
function debugLog(...args) {
  if (DEBUG_MODE) console.log("[DEBUG]", ...args);
}

/*************************************************/
/*             CONFIGURAZIONE PLUGIN             */
/*************************************************/
function setupPlugin() {	 
		var scelte = 
					"<div class='scelta' id='scelta_1'></div>"+
					"<div class='scelta' id='scelta_3'></div>"+
					"<div class='scelta' id='scelta_4'></div>"+
					"<div class='scelta' id='scelta_5'></div>"+
					"<div class='scelta' id='scelta_6'></div>"+
					"<div class='scelta' id='scelta_7'></div>"; 
					
		var contcomandi = 
					"<div class=''></div>"+
					"<div class='comando' id='salva_chat' title='Salva Chat'><i class='fa fa-download'></i></div>"+
					"<div class='comando' id='aprisimboli' title='Apri i simboli'><i class='fa fa-star'></i></div>"+ 
					"<div class='comando' id='lente' title='Vedi la descrizione del luogo'><img src='http://www.extremelot.eu/proc/img/_descr.gif' /></div>"+  
					"<div class='comando' id='dovegioco' title='Dove vuoi giocare oggi?'><i class='fa fa-hourglass'></i></div>"+
					"<div class='comando' id='apriazioncine' title='Apri Azioni'><i class='fa fa-diamond'></i></div>"+
					"<div class='comando' id='mappaTest' title='Mappa Testuale'><i class='fa fa-map'></i></div>"+
					"<div class='comando' id='miascheda' title='Apri Scheda'><i class='fa fa-id-badge'></i></div>"+
					"<div class='comando' id='scelto_forum' title='Apri Bacheche'><i class='fa fa-clipboard'></i></div>"+
					"<div class='comando' id='apri_online' title='Elenco online'><i class='fa fa-users'></i></div>"+ 
					"<div class='comando' id='leggiposta' title='Posta'><i class='fa fa-envelope'></i></div>"+
					"<div class='comando' id='regole' title='Apri il regolamento'><i class='fa fa-book'></i></div>"+
					"<div class='comando' id='scriviposta' title='Scrivi Missiva'><i class='fa fa-pencil'></i></div>"+
					"<div class='comando' id='banca' title='Banca di Lot'><i class='fa fa-money'></i></div>"+
					"<div class='comando' id='apri_editor' title='Campo testo per azioni'><i class='fa fa-commenting'></i></div>"+
          "<div class='comando' id='gest_Chat' title='Gestionale'><i class='fa fa-bookmark'></i></div>";
		


	var sceltine = scelte;
	var n = 0; 
	$('frameset').each(function(){  n++; if(n==1){ $(this).attr('id','miodivvino'+n); }  $(this).attr('myid','miodivvino'+n); });
	$('frame').each(function(){  n++;  $(this).attr('myid','mioframmino'+n); });
    $('#miodivvino1').wrap(document.createElement("body"));




  $(`<div id="menu-container" style="
      position: fixed;
      top: 2px;
      right: 5px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
  ">
      <div id="hamburger" style="
          cursor: pointer;
          padding: 6px 10px;
          font-size: 22px;
          background: rgba(255,255,255,0.85);
          color: #222;
          max-height: 30px;
          overflow-y: auto;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 0 3px rgba(0,0,0,0.2);
          display: none;
      ">☰</div>
      <div id="altroframeperaltraroba" style="
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 4px;
          max-height: 30px;
          overflow-y: auto;
          background: rgba(255,255,255,0.9);
          border-radius: 4px;
          border: 1px solid #ccc;
          box-shadow: 0 0 3px rgba(0,0,0,0.1);
      "></div>
  </div>`).appendTo('body');


	$("<div id='lamiamappa'></div>").appendTo('body');
	
	//$('#altroframeperaltraroba').load('https://extremeplug.altervista.org/docs/plugin/tasti_fato.php');
	$('#altroframeperaltraroba').html(contcomandi);


	$('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">').appendTo('head');
	setTimeout(inizializzaPlugin,1000);

	 $(window).on('click','input',function( event ) { event.preventDefault();alert('clicco');  });

/************************************************/
/*               MENU HAMBURGER                 */
/************************************************/
function aggiornaMenuResponsive() {
    if (window.innerWidth < 1000) {
        $('#altroframeperaltraroba').hide();
        $('#hamburger').show();
    } else {
        $('#altroframeperaltraroba').show();
        $('#hamburger').hide();
    }
}

$('#hamburger').on('click', function() {
    $('#altroframeperaltraroba').slideToggle();
});

aggiornaMenuResponsive();
$(window).on('resize', aggiornaMenuResponsive);
}
/************************************************/
/*    Recupera i dati del PG dal frame "logo"   */
/************************************************/
function RecuperoDatiPG() {
  try {
    const frameLogo = $("frame[name='logo']")[0];
    if (!frameLogo || !frameLogo.contentDocument) {
      debugLog("[DEBUG] frame[name='logo'] non trovato!");
      return { nome: null, luogo: null, html: null };
    }

    const $body = $("body", frameLogo.contentDocument);
    if ($body.length === 0) {
      debugLog("[DEBUG] Nessun body trovato dentro il frame logo!");
      return { nome: null, luogo: null, html: null };
    }

    const datiHTML = $body.html();
    // aggiorna div nascosto #datidelpg
    $("#datidelpg").remove();
    $("<div>", { id: "datidelpg", style: "display:none;" }).html(datiHTML).appendTo("body");

    const $div = $("#datidelpg");
    const nome = $div.find("input[name='player']").val() || null;
    let luogo = $div.find("input[name='titolo']").val() || null;

    if (luogo) {
      luogo = luogo.replace(/<\/?b>/g, ""); // pulizia
    }

    debugLog("[DEBUG] RecuperoDatiPG ->", { nome, luogo });
    return { nome, luogo, html: datiHTML };

  } catch (err) {
    console.error("[DEBUG] Errore in RecuperoDatiPG:", err);
    return { nome: null, luogo: null, html: null };
  }
}


function apriazioncine() { finestra('azioniFinestra','Azioni nel luogo','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/azioni_21.asp','width=950,height=550');  }

// === [1] Recupero dati del PG dal frame "logo" ===
function importaDatiPG() {
  debugLog("[DEBUG] Avvio importaDatiPG()");

  const frameLogo = $("frame[name='logo']")[0];
  if (!frameLogo) {
    debugLog("[DEBUG] frame[name='logo'] non trovato!");
    return null;
  }

  debugLog("[DEBUG] frame[name='logo'] trovato:", frameLogo);

  // recupera il body del frame
  const $body = $("body", frameLogo.contentDocument);
  debugLog("[DEBUG] body dentro frame logo:", $body.length > 0, $body);

  // copia l'html
  const datiHTML = $body.html();
  debugLog("[DEBUG] HTML estratto:", datiHTML ? datiHTML.substring(0, 300) + "..." : "(vuoto)");

  // crea (o sostituisce) il div nascosto
  $("#datidelpg").remove();
  const $div = $("<div>", { id: "datidelpg", style: "display:none;" }).html(datiHTML);
  $("body").append($div);

  // recupera il player
  const $inputPlayer = $div.find("input[name='player']");
  if ($inputPlayer.length > 0) {
    debugLog("[DEBUG] input[name='player'] trovato:", $inputPlayer[0].outerHTML);
    debugLog("[DEBUG] attr value:", $inputPlayer.attr("value"));
    debugLog("[DEBUG] proprietà .value:", $inputPlayer[0].value);
    debugLog("[DEBUG] jQuery .val():", $inputPlayer.val());
    return $inputPlayer.val();
  }

  debugLog("[DEBUG] input[name='player'] NON trovato");
  return null;
}

// === [2] Setup eventi dei comandi ===
function setupEventiPlugin() {
  debugLog("[DEBUG] Avvio setupEventiPlugin()");

  $(document)
    .on("click", "#mappaTest", function() {
        // Rimuove eventuale div precedente
        $('#mappaDiv').remove();

        // Crea div modale
        let contenitore = $("<div id='mappaDiv'></div>").appendTo('body');

        // Inserisce iframe con la mappa
        let iframe = $('<iframe>', {
            src: "https://ordinedelleguide.altervista.org/mappa/index.php",
            width: "100%",
            height: "100%",
            frameborder: 0
        });
        contenitore.append(iframe);

        // Trasforma in dialog jQuery UI
        contenitore.dialog({
            title: 'Mappa',
            resizable: true,
            draggable: true,
            position: { my: "center", at: "center", of: window },
            minHeight: 400,
            minWidth: 600,
            height: 700,
            width: 1000,
            modal: false,
            close: function(event, ui) {
                $(this).dialog("destroy").remove();
            }
        });
    })
    // Banca
    .on("click", "#banca", function() {
      finestra("Banca","Banca di Lot",
        "https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/lotnew/banca_d.asp",
        "width=90%,height=550"
      );
    })
    // Missiva
    .on("click", "#scriviposta, [myid='scriviposta']", function() { scriviposta(); })
    // Azioni
    .on("click", "#apriazioncine", function() { apriazioncine(); })
    .on("click", "#scelta_7", function() { apriazioncine(); })
    // Online
    .on("click", "#apri_online,[myid='vedionline'],#scelta_4", function() {
      finestra("vediOnline","Personaggi Online",
        "https://www.extremelot.eu/proc/collegati.asp",
        "width=950,height=550"
      );
    })
    .on("submit", '#dlg-vediOnline form[action="collegati.asp?pos=gilda"]',function(e) {  e.preventDefault(); 
      var modulo = 'form[action="collegati.asp?pos=gilda"]';
      var nomeprova = $(modulo).attr('action');
      var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
      var esito = "#dlg-vediOnline";
      $.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
    })
    .on('submit','#dlg-vediOnline form[action="collegati.asp?pos=clans"]',function(e) {  e.preventDefault(); 
        var modulo = 'form[action="collegati.asp?pos=clans"]';
        var nomeprova = $(modulo).attr('action');
        var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
        var esito = "#dlg-vediOnline";
        $.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
      })
      .on('submit','#dlg-vediOnline form[action="collegati.asp?pos=area"]',function(e) {  e.preventDefault(); 
        var modulo = 'form[action="collegati.asp?pos=area"]';
        var nomeprova = $(modulo).attr('action');
        var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
        var esito = "#dlg-vediOnline";
        $.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
      })
      .on('submit','#dlg-vediOnline form[action="collegati.asp?pos=razze"]',function(e) {  e.preventDefault(); 
        var modulo = 'form[action="collegati.asp?pos=razze"]';
        var nomeprova = $(modulo).attr('action');
        var nomelink = 'https://www.extremelot.eu/proc/'+nomeprova; 
        var esito = "#dlg-vediOnline";
        $.post( nomelink, $(modulo).serialize()).done(function(data) { $(esito).html(data); } ); 
      })
      .on('submit','#dlg-vediOnline form[action="chiedove.asp"]',function(e) {  e.preventDefault(); 
        finestra('doveGioco','Dove vuoi giocare?','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/chiedove.asp','width=950,height=550'); 
      })
      // intercetta i link dentro #dlg-vediOnline che puntano a collegati.asp
      .on("click", "#dlg-vediOnline a[href^='collegati.asp']", function(e) {
          e.preventDefault();
          var nomeprova = $(this).attr("href"); // es: collegati.asp?pos=A
          var nomelink = 'https://www.extremelot.eu/proc/' + nomeprova;
          var esito = "#dlg-vediOnline";

          $.get(nomelink).done(function(data) {
              $(esito).html(data);
          });
      })
      // click su "Guida di Lot"
      .on("click", "#dlg-vediOnline a[href='mappa_testuale.html']", function(e) {
          e.preventDefault();
          var esito = "#dlg-vediOnline";
          var nomelink = "https://ordinedelleguide.altervista.org/mappa/index.php";

          $(esito).html('<iframe src="' + nomelink + '" width="100%" height="550" frameborder="0"></iframe>');
      })
      .on("click", "#dlg-vediOnline a[href='../lotnew/leggi/primipassi']", function(e) {
          e.preventDefault();
          var esito = "#dlg-vediOnline";
          var nomelink = "https://www.extremelot.eu/lotnew/leggi/primipassi/";

          $(esito).html('<iframe src="' + nomelink + '" width="100%" height="550" frameborder="0"></iframe>');
      })

      // intercetta i link a chiedove.asp
      .on("click", "#dlg-vediOnline a[href='chiedove.asp']", function(e) {
          e.preventDefault();
          finestra(
              'doveGioco',
              'Dove vuoi giocare?',
              'https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/chiedove.asp',
              'width=950,height=550'
          );
      })


    // apri editor
    .on("click", "#apri_editor", function() { apriEditor(); })
    // bacheca
    .on("click", "#scelto_forum", function() { bacheca($("#imieiforumx").val()); })
    // salva chat
    .on("click", "#salva_chat", function() { salvaChat(); })
    // dove gioco
    .on("click", "#dovegioco", function() {
      finestra("doveGioco","Dove vuoi giocare?",
        "https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/chiedove.asp",
        "width=950,height=550"
      );
    })
    // simboli
    .on("click", "#aprisimboli, #scelta_5", function() {
      finestra("simboliLot","Simboli e statuti",
        "https://www.extremelot.eu/lotnew/simboli.asp",
        "width=950,height=550"
      );
    })
    // descrizione luogo
    .on("click", "#lente", function() {
      const framealtro = $("body", $("frame[name='testo']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);
      if (framealtro) {
        finestra("descLuogo","Descrizione del luogo",
          "https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/vedi_desc_21.asp",
          "width=950,height=550"
        );
      }
    })
    // scheda pg
    .on("click", "#miascheda", function() { vedischeda(); })
    // gestionale
    .on("click", "#gest_Chat", function() { apriGestionale(); })
    // regolamenti
    .on("click", "#regole, #scelta_6", function() {
      finestra("regoleLot","Regolamenti",
        "https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/lotnew/leggi/leggi.asp",
        "width=950,height=550"
      );
    })
    // posta
    .on("click", "#leggiposta, [myid='leggiposta'], #scelta_1", function() { leggiposta(); });
}

// === [3] Inizializzatore principale ===
function inizializzaPlugin() {
  debugLog("[DEBUG] Inizializzazione Plugin...");

  setupEventiPlugin();
  debugLog("[DEBUG] Plugin pronto.");
}


/************************************************/
/*                  POSTALOT                    */
/************************************************/
function scriviposta(nome) {if (!nome) { var nome = ''; } else { var nome = '?ID='+nome; } finestra('postalot','Piccione','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/posta/_scrivialtri.asp'+nome,'width=15%,height=250'); 

//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------//

$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-postalot").dialog(dialogOptions);

      $("#scriviposta").click(function() {
        if(!$("#dlg-postalot").dialog("isOpen")) {
          $("#dlg-postalot").dialog("open");
        } else {
          $("#dlg-postalot").dialog("close");
        }
      });

      });   
//-----------------------
}


function leggiposta() { finestra('postaLot','Posta','https://extremeplug.altervista.org/docs/plugin/altri.php?link=https://www.extremelot.eu/proc/posta/leggilaposta.asp','width=900,height=550'); 
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-postaLot").dialog(dialogOptions);

      $("#leggiposta").click(function() {
        if(!$("#dlg-postaLot").dialog("isOpen")) {
          $("#dlg-postaLot").dialog("open");
        } else {
          $("#dlg-postaLot").dialog("close");
        }
      });

      });   
}

/************************************************/
/*                   SALVA CHAT                 */
/************************************************/

/*-----salviamo la nostra giocata---*/
// [1] Pulisce i div temporanei
function pulisciDomTemporaneo() {
  $('#imieidati, #miachattina, #linksalva').remove();
}

// [2] Recupera dati PG dal frame logo
function recuperaDatiPG() {
  const frameinfo = $("body", $("frame[name='logo']")[0].contentDocument);
  if (!frameinfo) return null;

  const dati = frameinfo.html();
  const salvadati = "<div id='imieidati' style='display:none;'>" + dati + "</div>";
  $(salvadati).appendTo('body');

  const nome = $("#imieidati input[name='player']").val() || "Sconosciuto";
  let luogo = $("#imieidati input[name='titolo']").val() || "Luogo sconosciuto";
  luogo = luogo.replace("<b>", "").replace("</b>", "");

  return { nome, luogo };
}

// [3] Recupera la chat dal frame testo
function recuperaChat() {
  const framechat = $('body', $("frame[name='testo']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);
  if (!framechat) return "";

  let info = framechat.html();
  info = info.replace(/\&gt;/g, "»</i>").replace(/\&lt;/g, '<i>«');
  return info;
}

// [4] Prepara il form nascosto
function preparaFormSalvataggio(nome, luogo, info) {
  const salvachat = `
    <div id='miachattina' style='display:none;'>
      <form id='salvataggio' name='salvataggio'>
        <input type='hidden' name='pg' id='pg' value='${nome}' />
        <input type='hidden' name='luogo' id='luogo' value="${luogo}" />
        <textarea id='chat' name='chat'>${info}</textarea>
      </form>
      <div id='esito_salva'></div>
    </div>`;
  $(salvachat).appendTo('body');
}

// [5] Invia i dati al server
function inviaDatiAlServer() {
  const url = "https://extremeplug.altervista.org/docs/plugin/salva_chat3.php";
  const modulo = "#salvataggio"; 
  const esito = "#esito_salva";

  $.post(url, $(modulo).serialize())
   .done(function(data) { $(esito).html(data); });
}

// [6] Mostra dialog di conferma
function mostraDialogSalvataggio() {
  $('#esito_salva').dialog({
    title: 'Chat Salvata',
    resizable: true,
    position: { my: "center top", at: "center top", of: window },
    minHeight: 100,
    minWidth: 200,
    height: 150,
    width: 300,
    cache: false,
    open: function () { ccc(); },
    close: function () { $(this).dialog("close").remove(); }
  });

  // chiude dopo 10 secondi
  setTimeout(function() { $("#esito_salva").remove(); }, 10000);
}

// [ENTRY POINT]
function salvaChat() {
  pulisciDomTemporaneo();

  const datiPG = RecuperoDatiPG();
  if (!datiPG || !datiPG.nome) {
    alert("Impossibile recuperare i dati del PG");
    return;
  }

  const info = recuperaChat();
  preparaFormSalvataggio(datiPG.nome, datiPG.luogo, info);

  inviaDatiAlServer();
  mostraDialogSalvataggio();
}


function salvamessaggi() {
  var framemex = $('body', $("frame[name='mioframe']", $("frame[name='result']")[0].contentDocument)[0].contentDocument);
  var dati = framemex.html();
}

/************************************************/
/*              editor 2000 caratteri           */
/*************************************************/


function ccc() { $('#mioeditorino').on({
    keyup: function() { contacara(); },
    blur:  function() { contacara(); },
    focus: function() { contacara(); }
}) }


function apriEditor() { 
if ( $("#divinfinestra").length ) { $("#divinfinestra").remove(); }  
var inteditorino = "<div id='divinfinestra'><div class='intedit'><textarea id='mioeditorino' placeholder='Scrivi la tua azione'maxlength='2000'></textarea><button id='button'>Copia</button></div><div id='contacaratteri'></div></div>";
$('body').append(inteditorino);

	$('#divinfinestra').dialog({ title:'Scrivi Azione', resizable: true, position: { my: "center", 	at: "center", of: window }, 
		minHeight: 250,	minWidth: 550,  height: 300, width:600, cache: false,
		open: function (event,ui) { ccc();contacara(); },
		close: function(event, ui) { $(this).dialog("close"); $(this).remove(); } });
$('#divinfinestra').dialogExtend({
maximizable :true,//massimizzo
minimizable:true,// minimizzo
});

//bottoncino

$("button").click(function(){
    $("textarea").select();
    document.execCommand('cut');
});


//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#divinfinestra").dialog(dialogOptions);

      $("#apri_editor").click(function() {
        if(!$("#divinfinestra").dialog("isOpen")) {
          $("#divinfinestra").dialog("open");
        } else {
          $("#divinfinestra").dialog("close");
        }
      });

      });   
//-----------------------
};


/************************************************/
/*                   BACHECA                    */
/************************************************/



function bacheca(id) { 
//if ( $("#dlg-VediBacheca_b1").dialog("isOpen")) { $("#dlg-VediBacheca_b1").remove(); }  
var url = "https://www.extremelot.eu/proc/forum/forum.asp?codforum=225";
if (!id) { var id = 'b1'; } 
if (id == 'b1') { var url = "https://www.extremelot.eu/proc/forum/bacheca.asp";  var nomebacheca = "Ducale"; } 
else if (id == 'b2') { var url = "https://www.extremelot.eu/proc/forum/forumel.asp?cod=120"; var nomebacheca = "Fato";  }
else {  var nomebacheca = $('#imieiforumx option:selected').text(); var url = "https://www.extremelot.eu/proc/forum/forum.asp?codforum="+id;  }
finestra('VediBacheca_'+id,'Bacheca '+nomebacheca,'https://extremeplug.altervista.org/docs/plugin/bacheche.php?link='+url,'width=1050,height=550');

 // Setto il tempo massimo di apertura del dialog a 10 minuti
      setTimeout(function(){
        $("#dlg-VediBacheca_b1").remove();
     }, 600000);
	 
//------------ verifichiamo che il dialog sia aperto e non apriamone un secondo --------
$(document).ready(function() {
         var dialogOptions = {
        autoOpen: false
      };
      $("#dlg-VediBacheca_b1").dialog(dialogOptions);

      $("#scelto_forum").click(function() {
        if(!$("#dlg-VediBacheca_b1").dialog("isOpen")) {
          $("#dlg-VediBacheca_b1").dialog("open");
        } else {
          $("#dlg-VediBacheca_b1").dialog("close");
        }
      });

      });   
//-----------------------


} 
/************************************************/
/*                    AZIONI                    */
/************************************************/


function aziona(id) { top.result.location='../proc/azioni.asp?azione='+id; } 

/************************************************/
/*                SCHEDA PG                     */
/************************************************/
// Recupera il nome del PG da varie fonti
function recuperaNomePlayer() {
  const { nome } = RecuperoDatiPG();
  return nome || null;
}


// Pulisce e apre la finestra della scheda
function apriScheda(nome) {
  debugLog("[DEBUG] apriScheda nome:", nome);

  const pulito = nome.replace(/[^\w\-]/g, "");
  debugLog("[DEBUG] nome pulito:", pulito);

  const url = "https://www.extremelot.eu/proc/schedaPG/scheda.asp?ID=" + encodeURIComponent(pulito);
  debugLog("[DEBUG] url finale:", url);

  finestra(
    "scheda_" + pulito,
    "Scheda " + pulito,
    "https://extremeplug.altervista.org/docs/plugin/altri.php?classe=scheda&link=" + url,
    "width=1000,height=600"
  );
}

// Mostra la dialog per chiedere conferma all’utente
function mostraDialogScheda() {
  const existing = document.getElementById("confermaSchedaDialog");
  if (existing) existing.remove();

  const dialogHtml = `
    <div id="confermaSchedaDialog" title="Vedi Scheda?">
      <p>Vuoi vedere la tua scheda?</p>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", dialogHtml);

  $("#confermaSchedaDialog").dialog({
    buttons: {
      "Sì": function () {
        $(this).dialog("close");
        let nome = recuperaNomePlayer();
        if (!nome) nome = prompt("Inserisci il nome del personaggio:");
        if (nome) apriScheda(nome);
      },
      "No": function () {
        $(this).dialog("close");
        const nome = prompt("Inserisci il nome del personaggio:");
        if (nome) apriScheda(nome);
      }
    },
    close: function () { $(this).remove(); }
  });
}


// Entry point
function vedischeda() {
  mostraDialogScheda();
}

// Variante con caricamento prima dei dati
function vedischedaConCaricamento() {
  if (!document.getElementById("datidelpg")) {
    debugLog("[DEBUG] Caricamento dati del PG...");
    inizializzaPlugin();
    setTimeout(() => vedischeda(), 100);
  } else {
    vedischeda();
  }
}

function nofarniente() { } 

/************************************************/
/*             DASHBOARD GESTIONALE             */
/************************************************/
function apriGestionale() {
    $('#gestionale').remove();

    // creo il contenitore del gestionale
    let contenitore = $("<div id='gestionale'></div>").appendTo('body');

    // carico il gestionale intero dentro un iframe
    let iframe = $('<iframe>', {
        src: "https://www.extremelot.eu/proc/gestionale/dashboardGE.asp",
        width: "100%",
        height: "100%",
        frameborder: 0
    });

    contenitore.append(iframe);

    // apro il dialog
    contenitore.dialog({
        title: 'Gestionale',
        resizable: true,
        draggable: true,
        position: { my: "center top", at: "center top", of: window },
        minHeight: 400,
        minWidth: 600,
        height: 700,
        width: 1000,
        modal: false, // così non blocca la pagina sotto
        close: function(event, ui) {
            $(this).dialog("destroy").remove();
        }
    });
}

/* e dopo tanto lavoro..carichiamo sto plugin all'avvio*/
$(function(){  
	var fileName = location.href.split("/").slice(-1); 
	if (fileName == '_index2.htm') { setupPlugin(); }   
});

 