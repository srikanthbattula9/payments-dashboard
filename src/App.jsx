import { useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8000'

function App() {
  const [cardToken, setCardToken] = useState('')
  const [amount, setAmount] = useState('')
  const [merchantId, setMerchantId] = useState('coffee_shop')
  const [mcc, setMcc] = useState('5812')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [accountId, setAccountId] = useState('')
  const [balance, setBalance] = useState(null)

  async function handleAuthorize(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const idempotencyKey = crypto.randomUUID()
      const response = await fetch(`${API_BASE}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          card_token: cardToken,
          amount_minor: Math.round(parseFloat(amount) * 100),
          merchant_id: merchantId,
          mcc: mcc,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${JSON.stringify(data)}`)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(`Request failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckBalance(e) {
    e.preventDefault()
    setBalance(null)
    try {
      const response = await fetch(`${API_BASE}/accounts/${accountId}/balance`)
      const data = await response.json()
      if (!response.ok) {
        setBalance({ error: JSON.stringify(data) })
      } else {
        setBalance(data)
      }
    } catch (err) {
      setBalance({ error: err.message })
    }
  }

  return (
    <div className="dashboard">
      <h1>Card Issuer-Processor Dashboard</h1>
      <p className="subtitle">
        Sends real authorization requests to the Python service (card-issuer-processor) on port 8000.
      </p>

      <section className="panel">
        <h2>Authorize a Transaction</h2>
        <form onSubmit={handleAuthorize}>
          <label>
            Card Token
            <input
              type="text"
              value={cardToken}
              onChange={(e) => setCardToken(e.target.value)}
              placeholder="paste a card_token from scripts/cards.json"
              required
            />
          </label>
          <label>
            Amount (USD)
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              required
            />
          </label>
          <label>
            Merchant ID
            <input
              type="text"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
            />
          </label>
          <label>
            MCC
            <input
              type="text"
              value={mcc}
              onChange={(e) => setMcc(e.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Authorizing…' : 'Authorize'}
          </button>
        </form>

        {error && <div className="result error">{error}</div>}

        {result && (
          <div className={`result ${result.status === 'approved' ? 'approved' : 'declined'}`}>
            <strong>{result.status.toUpperCase()}</strong>
            <div>auth_id: {result.auth_id}</div>
            {result.decline_code && <div>decline_code: {result.decline_code}</div>}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Check Account Balance</h2>
        <form onSubmit={handleCheckBalance}>
          <label>
            Account ID
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. 167"
              required
            />
          </label>
          <button type="submit">Check Balance</button>
        </form>

        {balance && (
          <div className="result">
            {balance.error
              ? balance.error
              : `Ledger balance: $${(balance.ledger_balance_minor / 100).toFixed(2)}`}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
