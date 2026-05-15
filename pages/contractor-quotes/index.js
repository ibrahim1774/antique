import Layout from '../../components/contractor-quotes/Layout'
import Hero from '../../components/contractor-quotes/Hero'
import DemoWidget from '../../components/contractor-quotes/DemoWidget'
import StatRow from '../../components/contractor-quotes/StatRow'
import StepRow from '../../components/contractor-quotes/StepRow'
import FeatureGrid from '../../components/contractor-quotes/FeatureGrid'
import PricingGrid from '../../components/contractor-quotes/PricingGrid'
import Testimonials from '../../components/contractor-quotes/Testimonials'
import FaqAccordion from '../../components/contractor-quotes/FaqAccordion'
import FinalCta from '../../components/contractor-quotes/FinalCta'

export default function QuoteClearLanding() {
  return (
    <Layout>
      <Hero />
      <DemoWidget />
      <StatRow />
      <StepRow />
      <FeatureGrid />
      <PricingGrid />
      <Testimonials />
      <FaqAccordion />
      <FinalCta />
    </Layout>
  )
}
