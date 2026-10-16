import { dropClientName, channelLabel } from '../../../../app-79ea7266eab9/main/app/src/orbit/lib/format'
import { statusOf, needsMe, canStartBuild, readyToBuild, type Poc } from '../../../../app-79ea7266eab9/main/app/src/orbit/lib/model'
const g = { status: 'pending', owner: false, manager: false, summary: '' } as const
const base = { id: 'x', poc_id: 'x', client: 'Pentland', client_name: 'Pentland', client_slug: 'pentland', use_case: 'Pentland Vulnerability Use Case', brief: '', owner_name: 'Gourav Mahunta', owner_email: 'gourav.mahunta@unifyapps.com', manager_name: 'Ishita Verma', manager_email: '', started_by: '', started_at: 0, stage: '0_kickoff', current_gate: 'none', gates: { g1: g, g2: g, g3: g, g4: g }, gate_summary: '', status: 'running', blocked_on: '', slack_channel: 'pentland-poc', build_run_id: '', last_activity: '', last_activity_at: 0, _raw: {} } as unknown as Poc
const owner = { name: 'Gourav Mahunta', first: 'Gourav', email: 'gourav.mahunta@unifyapps.com', ready: true }
const other = { name: 'Ishita Verma', first: 'Ishita', email: 'ishita@x.com', ready: true }
console.log(dropClientName('Pentland Vulnerability Use Case', 'Pentland'), '|', dropClientName('Pentlandia thing', 'Pentland'), '|', dropClientName('Pentland', 'Pentland'), '|', dropClientName('Product enrichment', 'Pentland'))
console.log(channelLabel('pentland-poc'), channelLabel('#x'), JSON.stringify(channelLabel('')))
console.log('fresh/owner', statusOf(base, owner), needsMe(base, owner), canStartBuild(base, owner))
console.log('fresh/other', statusOf(base, other), needsMe(base, other), canStartBuild(base, other))
const started = { ...base, build_run_id: 'https://claude.invalid/code/s1' } as Poc
console.log('started/owner', statusOf(started, owner), readyToBuild(started), canStartBuild(started, owner))
