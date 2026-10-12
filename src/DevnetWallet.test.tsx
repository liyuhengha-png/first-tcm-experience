import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getWallets } from '@wallet-standard/app'
import { DevnetWallet } from './DevnetWallet'
import { dictionaries } from './i18n'

vi.mock('@wallet-standard/app', () => ({ getWallets: vi.fn() }))
afterEach(() => vi.clearAllMocks())
describe('explicit bilingual wallet connection', () => {
  for (const locale of ['en', 'zh-CN'] as const) it(`connects only on explicit action in ${locale}`, async () => {
    const account = { address: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgMQHGwUzALK', chains: ['solana:devnet'], features: ['solana:signTransaction'] }
    const connect = vi.fn().mockResolvedValue({ accounts: [account] })
    const sign = vi.fn()
    const wallet = { name: 'Synthetic wallet', accounts: [account], chains: ['solana:devnet'], features: { 'standard:connect': { connect }, 'solana:signTransaction': { signTransaction: sign, supportedTransactionVersions: [0] } } }
    vi.mocked(getWallets).mockReturnValue({ get: () => [wallet], on: vi.fn(), register: vi.fn() } as unknown as ReturnType<typeof getWallets>)
    const { rerender } = render(<DevnetWallet t={dictionaries[locale]} />)
    expect(getWallets).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: dictionaries[locale].walletFind }))
    expect(connect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: `${dictionaries[locale].walletConnect} · Synthetic wallet` }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(dictionaries[locale].walletConnected))
    fireEvent.click(screen.getByLabelText(dictionaries[locale].demoAcknowledge))
    expect(screen.getByRole('button', { name: dictionaries[locale].demoFund })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: dictionaries[locale].demoFund }))
    const next = locale === 'en' ? 'zh-CN' : 'en'
    rerender(<DevnetWallet t={dictionaries[next]} />)
    expect(screen.getByRole('status')).toHaveTextContent(dictionaries[next].walletConnected)
    expect(screen.getByLabelText(dictionaries[next].demoAcknowledge)).toBeChecked()
    expect(screen.getByRole('button', { name: dictionaries[next].demoFund })).toBeDisabled()
    expect(connect).toHaveBeenCalledTimes(1)
    expect(sign).not.toHaveBeenCalled()
    fireEvent.click(screen.getByLabelText(dictionaries[next].deploymentFundingConsent))
    fireEvent.click(screen.getByRole('button', { name: dictionaries[next].deploymentFundingButton }))
    await waitFor(() => expect(screen.getByText(`${dictionaries[next].fundingWrongAccount} ${dictionaries[next].fundingNotSent}`)).toBeVisible())
    expect(screen.getByRole('button', { name: dictionaries[next].deploymentFundingButton })).toBeEnabled()
    expect(sign).not.toHaveBeenCalled()
    expect(screen.queryByText(dictionaries[next].deploymentFundingPending)).not.toBeInTheDocument()
  })
})
