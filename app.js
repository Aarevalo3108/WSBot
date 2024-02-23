const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const { getMonitor } = require("consulta-dolar-venezuela");

const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const schedule = require('node-schedule')
let dolar = [];
const main = async () => {
  await consulta(dolar)
  const adapterDB = new MockAdapter()
  const adapterFlow = createFlow([flowSaludo, flowTasa,flowDolar,flowBolivar])
  const adapterProvider = createProvider(BaileysProvider)
  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  })
  const sendRate = async () => {
    const phone = '120363038471770187@g.us'
    const text = '[PAR]: ' + dolar[0] + ' Bs.\n[BCV]: ' + dolar[1] + ' Bs.'
    adapterProvider.sendText(phone, text)
    console.log(text)
  }
  const rule = {
    dayOfWeek: [1, 2, 3, 4, 5],
    hour: [9, 13], // 9 para 9am, 13 para 1pm
    minute: 20 // 20 para 20 minutos
  }
  schedule.scheduleJob(rule, async () => {
    await consulta(dolar)
    await sendRate()
    console.log(`Dolar actualizado!`);
  })
}

const flowSaludo = addKeyword(['hola','alo','buenas','saludos'])
.addAnswer
([
  `🙌 Hola bienvenido a *DolarBot* (de momento, unica funcion), es un proyecto prueba que estoy desarrollando para enviar mensajes automaticos. Hecho por Angel Arevalo :D.
   \n- Escribe 💲 *tasa* o *t* 💲 la proxima vez si solo deseas saber la tasa de cambio del bolivar/dolar.
   \n- Escribe 🧮 *dolar* o *d* 🧮 si deseas convertir una cantidad en $ y mostrar su equivalente en Bs.
   \n- Escribe 🧮 *bolivar* o *b* 🧮 si deseas convertir una cantidad en Bs y mostrar su equivalente en $.`
])

const flowTasa = addKeyword(['tasa','precio','t'])
.addAnswer('momento!...🧐',null,
  async (_,{flowDynamic}) =>{
    return flowDynamic([{body: '[PAR]: ' + dolar[0] +' Bs.\n[BCV]: ' + dolar[1]+' Bs.'}])
  }
)

const flowDolar = addKeyword(['dolar','d']).addAnswer('🟢Ingresa un monto en dolares para convertir!. Ejemplo: 7.5🟢',{capture: true},
  async (ctx,{flowDynamic, fallBack}) =>{
    if(!isNaN(Number(ctx.body)) && Math.sign(Number(ctx.body)) == 1) {
      return flowDynamic([{body: `${ctx.body}$ a Bs es:\n[PAR]: ${(ctx.body*dolar[0]).toFixed(2)} Bs.\n[BCV]: ${(ctx.body*dolar[1]).toFixed(2)} Bs.`}])
    }
    else return fallBack()
})

const flowBolivar = addKeyword(['bolivar','b']).addAnswer('🔵Ingresa un monto en bolivares para convertir!. Ejemplo: 350🔵',{capture: true},
  async (ctx,{flowDynamic, fallBack}) =>{
    if(!isNaN(Number(ctx.body)) && Math.sign(Number(ctx.body)) == 1) {
      return flowDynamic([{body: `${ctx.body} Bs a $ es:\n[PAR]: ${(ctx.body/dolar[0]).toFixed(2)}$\n[BCV]: ${(ctx.body/dolar[1]).toFixed(2)}$`}])
    }
    else return fallBack()
})

async function consulta(array) {
  array[0] = await getMonitor('enparalelovzla', 'price', false);
  array[1] = await getMonitor('bcv', 'price', false);
  console.log(`Dolar actualizado.`)
  return array;
}

main()