import { useRef, useState } from 'react'
import { getWallets } from '@wallet-standard/app'
import { StandardConnect, type StandardConnectFeature, type StandardConnectOutput } from '@wallet-standard/features'
import { SolanaSignTransaction, type SolanaSignTransactionFeature } from '@solana/wallet-standard-features'
import type { Messages } from './i18n/en'

// Explicit connection only: never auto-connect or authorize a transaction.
export function DevnetWallet({ t }: { t: Messages }) {
  const localSetup = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  const [wallets, setWallets] = useState<ReturnType<ReturnType<typeof getWallets>['get']>>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selection, setSelection] = useState<{ wallet: (typeof wallets)[number]; account: StandardConnectOutput['accounts'][number] }>()
  const [ready, setReady] = useState(false)
  const [ack, setAck] = useState(false)
  const [phase, setPhase] = useState<'empty' | 'attempted' | 'funded' | 'released' | 'refunded'>('empty')
  const [signature, setSignature] = useState('')
  const [fundingAck, setFundingAck] = useState(false)
  const [fundingStarted, setFundingStarted] = useState(false)
  const [fundingSignature, setFundingSignature] = useState('')
  const [fundingStep, setFundingStep] = useState<'checking' | 'simulating' | 'wallet' | 'broadcasting' | 'confirming' | 'failed' | ''>('')
  const [fundingFailure, setFundingFailure] = useState<'fundingWrongAccount' | 'fundingVersion' | 'fundingNetworkError' | 'fundingSimulationError' | 'fundingWalletError'>('fundingNetworkError')
  const demoId = useRef<Uint8Array | undefined>(undefined)
  const lock = useRef(false)
  function discover() {
    setError(false)
    setWallets(getWallets().get().filter(wallet => wallet.chains.includes('solana:devnet') && StandardConnect in wallet.features && SolanaSignTransaction in wallet.features))
  }
  async function connect(wallet: (typeof wallets)[number]) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(false)
    try {
      const feature = wallet.features[StandardConnect] as StandardConnectFeature[typeof StandardConnect]
      const result = await feature.connect()
      const account = result.accounts.find(account => account.chains.includes('solana:devnet') && account.features.includes(SolanaSignTransaction))
      if (!account) throw new Error('Unsupported account')
      setSelection({ wallet, account }); setReady(false)
      setConnected(true)
    } catch { setError(true) }
    finally { lock.current = false; setBusy(false) }
  }
  async function checkNetwork() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(false); setReady(false)
    try { const client = await import('./solana/transaction'); await client.networkReady(); setReady(true) }
    catch { setError(true) }
    finally { lock.current = false; setBusy(false) }
  }
  async function transact(action: 'fund' | 'release' | 'refund') {
    if (lock.current || !selection || !ready || !ack || (action === 'fund' ? phase !== 'empty' : phase !== 'funded')) return
    lock.current = true; setBusy(true); setError(false)
    try {
      const client = await import('./solana/transaction')
      const escrow = await import('./solana/escrow')
      const { address } = await import('@solana/kit')
      if (!selection.wallet.accounts.some(account => account.address === selection.account.address)) throw new Error('Wallet account changed')
      const payer = address(selection.account.address)
      if (action === 'fund') { demoId.current = crypto.getRandomValues(new Uint8Array(32)); setPhase('attempted') }
      if (!demoId.current) throw new Error('Missing demo')
      const instruction = action === 'fund' ? await escrow.fundInstruction(payer, client.demoRecipient, demoId.current, 1_000_000_000n, await client.chainTime() + 3600n) : action === 'release' ? await escrow.releaseInstruction(payer, client.demoRecipient, demoId.current) : await escrow.refundInstruction(payer, demoId.current)
      const feature = selection.wallet.features[SolanaSignTransaction] as SolanaSignTransactionFeature[typeof SolanaSignTransaction]
      if (!feature.supportedTransactionVersions.includes(0)) throw new Error('Unsupported transaction version')
      const confirmed = await client.requestDemoTransaction(selection.account, feature.signTransaction.bind(feature), instruction, payer)
      setSignature(confirmed); setPhase(action === 'fund' ? 'funded' : action === 'release' ? 'released' : 'refunded')
    } catch { setError(true) }
    finally { lock.current = false; setBusy(false) }
  }
  async function fundDeployment() {
    if (!localSetup || lock.current || !selection || !fundingAck || fundingStarted) return
    lock.current = true; setBusy(true); setError(false); setFundingStarted(true)
    setFundingStep('checking')
    let broadcast = false
    let stage = 'checking'
    try {
      if (selection.account.address !== '7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE' || !selection.wallet.accounts.some(account => account.address === selection.account.address)) { setFundingFailure('fundingWrongAccount'); throw new Error('Wrong account') }
      const client = await import('./solana/transaction')
      const feature = selection.wallet.features[SolanaSignTransaction] as SolanaSignTransactionFeature[typeof SolanaSignTransaction]
      if (!feature.supportedTransactionVersions.includes(0)) { setFundingFailure('fundingVersion'); throw new Error('Unsupported transaction version') }
      setFundingSignature(await client.requestDeploymentFunding(selection.account, feature.signTransaction.bind(feature), next => {
        stage = next; setFundingStep(next)
        if (next === 'broadcasting') broadcast = true
      }))
    } catch (caught) {
      if (caught instanceof Error && !['Wrong account', 'Unsupported transaction version'].includes(caught.message)) setFundingFailure(stage === 'simulating' ? 'fundingSimulationError' : stage === 'wallet' ? 'fundingWalletError' : 'fundingNetworkError')
      if (!broadcast) { setFundingStarted(false); setFundingStep('failed') }
      setError(true)
    }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="card mt-8"><h2>{t.walletTitle}</h2><p>{t.walletBoundary}</p>
    <button type="button" className="primary mt-4" disabled={busy || phase !== 'empty'} onClick={discover}>{t.walletFind}</button>
    {wallets.length === 0 && <p className="mt-4">{t.walletHelp}</p>}
    {wallets.map((wallet, index) => <button type="button" className="mt-4" key={index} disabled={busy || phase !== 'empty'} onClick={() => void connect(wallet)}>{t.walletConnect} · {wallet.name}</button>)}
    {connected && <p role="status" className="mt-4">{t.walletConnected}</p>}
    {error && <p role="alert" className="mt-4">{t.walletError}</p>}
    {connected && <>
      {localSetup && <section className="card mt-4"><h3>{t.deploymentFundingTitle}</h3><p>{t.deploymentFundingNotice}</p>
        <p className="break-all">{t.fundingConnectedAddress}: {selection?.account.address}</p>
        <p className="break-all">7Vw7cQoJqxR3DQpWnpXTtE9Wq2BNzxkqep2b6vkCMwVE → 4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ</p>
        <label className="block mt-4"><input type="checkbox" checked={fundingAck} disabled={busy} onChange={event => setFundingAck(event.target.checked)} /> {t.deploymentFundingConsent}</label>
        <button type="button" disabled={busy || !fundingAck || fundingStarted} onClick={() => void fundDeployment()}>{t.deploymentFundingButton}</button>
        {busy && fundingStep && fundingStep !== 'failed' && <p role="status">{t[`fundingStage_${fundingStep}`]}</p>}
        {fundingStep === 'failed' && <p role="alert">{t[fundingFailure]} {t.fundingNotSent}</p>}
        {fundingStarted && !fundingSignature && <p>{t.deploymentFundingPending}</p>}
        {fundingSignature && <p role="status">{t.demoConfirmed} <a href={`https://explorer.solana.com/tx/${fundingSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{t.demoExplorer}</a></p>}
      </section>}
      <p className="mt-4">{t.demoTransferDetails}</p>
      <p className="mt-4">{t.escrowAuthority}</p>
      <p className="mt-4 break-all">{t.demoRecipientLabel}: 4CDKMknT9HfksniUUucHxxEcotkgYqDzpnwVakSTn5uJ</p>
      <label className="mt-4 block"><input type="checkbox" checked={ack} disabled={busy} onChange={event => setAck(event.target.checked)} /> {t.demoAcknowledge}</label>
      <button type="button" disabled={busy} onClick={() => void checkNetwork()}>{t.demoCheck}</button>
      <button type="button" disabled={busy || !ready || !ack || phase !== 'empty'} onClick={() => void transact('fund')}>{t.demoFund}</button>
      <button type="button" disabled={busy || !ready || !ack || phase !== 'funded'} onClick={() => void transact('release')}>{t.demoRelease}</button>
      <button type="button" disabled={busy || !ready || !ack || phase !== 'funded'} onClick={() => void transact('refund')}>{t.demoRefund}</button>
      {phase === 'attempted' && <p>{t.demoPending}</p>}
      {signature && <p role="status">{t.demoConfirmed} <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noopener noreferrer">{t.demoExplorer}</a></p>}
    </>}
    <p className="mt-4">{t.escrowProgress}</p>
  </section>
}
