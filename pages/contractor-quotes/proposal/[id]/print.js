import { useEffect } from 'react'
import Head from 'next/head'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../api/auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import ProposalView from '../../../../components/contractor-quotes/ProposalView'

export default function PrintProposal({ proposal, items, profile }) {
  useEffect(() => {
    // Auto-open the browser print dialog on load
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Head>
        <title>{proposal?.title || 'Proposal'} — print</title>
        <meta name="robots" content="noindex" />
      </Head>
      <ProposalView proposal={proposal} items={items} profile={profile} />
    </>
  )
}

export async function getServerSideProps(ctx) {
  const { id } = ctx.params
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session) {
    return {
      redirect: { destination: `/contractor-quotes/login?next=/contractor-quotes/proposal/${id}/print`, permanent: false },
    }
  }

  const sb = getSupabaseAdmin()
  const { data: proposal } = await sb
    .from('qc_proposals')
    .select('*')
    .eq('id', id)
    .eq('user_email', session.user.email)
    .maybeSingle()
  if (!proposal) return { notFound: true }

  const { data: items } = await sb
    .from('qc_proposal_line_items')
    .select('*')
    .eq('proposal_id', id)
    .order('sort_order', { ascending: true })

  const { data: profile } = await sb
    .from('contractor_profiles')
    .select('*')
    .eq('email', session.user.email)
    .maybeSingle()

  return {
    props: {
      proposal: JSON.parse(JSON.stringify(proposal)),
      items: items ? JSON.parse(JSON.stringify(items)) : [],
      profile: profile ? JSON.parse(JSON.stringify(profile)) : null,
    },
  }
}
