import Layout from '../../components/contractor-quotes/Layout'
import Hero from '../../components/contractor-quotes/Hero'
import StatRow from '../../components/contractor-quotes/StatRow'
import DemoWidget from '../../components/contractor-quotes/DemoWidget'
import StepRow from '../../components/contractor-quotes/StepRow'
import Testimonials from '../../components/contractor-quotes/Testimonials'
import FaqAccordion from '../../components/contractor-quotes/FaqAccordion'
import FinalCta from '../../components/contractor-quotes/FinalCta'

export default function QuoteClearLanding() {
  return (
    <Layout>
      <Hero />
      <StatRow />
      <DemoWidget />
      <StepRow />
      <Testimonials />
      <FaqAccordion />
      <FinalCta />
    </Layout>
  )
}
