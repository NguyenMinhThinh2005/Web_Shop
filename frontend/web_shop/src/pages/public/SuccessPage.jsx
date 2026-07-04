import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { publicApi } from '../../api/publicApi'
import SuccessCard from '../../components/checkout/SuccessCard'

function SuccessPage() {
  const { slug } = useParams()
  const location = useLocation()
  const [shop, setShop] = useState(null)
  const [order] = useState(() => {
    if (location.state?.order) {
      return location.state.order
    }

    try {
      return JSON.parse(localStorage.getItem(`lastOrder:${slug}`)) || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    publicApi.getShop(slug).then((response) => setShop(response.data.shop))
  }, [slug])

  return (
    <main className="success-page">
      <SuccessCard shop={shop} order={order} shopSlug={slug} />
    </main>
  )
}

export default SuccessPage
