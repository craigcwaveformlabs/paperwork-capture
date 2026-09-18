export type ClientSubmission = {
  id: string;
  clientName: string;
  user: string;
  email: string;
  accountManager: string;
  submissionType: string;
  periodLabel: string;
  submissionDue: string;
  clientApproval: string;
  dueStatus: string;
};

export const MOCK_SUBMISSIONS: ClientSubmission[] = [
  {
    id: '1',
    clientName: 'Nathan Berry Design',
    user: 'Nathan Berry',
    email: 'nathan@nathanberrydesign.co.uk',
    accountManager: 'Kallum Corke',
    submissionType: 'Q1',
    periodLabel: '06 Apr 26 - 05 Jul 26',
    submissionDue: '21 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '2',
    clientName: 'Electrician (sole trader)',
    user: 'Ben Morley',
    email: 'ben@electriciansoletrader.co.uk',
    accountManager: 'Ben Morley',
    submissionType: 'Q2',
    periodLabel: '06 Jul 26 - 05 Oct 26',
    submissionDue: '24 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '3',
    clientName: 'Nathan Berry Design',
    user: 'Nathan Berry',
    email: 'nathan@nathanberrydesign.co.uk',
    accountManager: 'Kallum Corke',
    submissionType: 'Q2',
    periodLabel: '06 Jul 26 - 05 Oct 26',
    submissionDue: '24 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '4',
    clientName: 'Electrician (sole trader)',
    user: 'Ben Morley',
    email: 'ben@electriciansoletrader.co.uk',
    accountManager: 'Ben Morley',
    submissionType: 'End of Year',
    periodLabel: '06 Apr 25 - 05 Apr 26',
    submissionDue: '26 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '5',
    clientName: 'Electrician (sole trader)',
    user: 'Ben Morley',
    email: 'ben@electriciansoletrader.co.uk',
    accountManager: 'Ben Morley',
    submissionType: 'Final Declaration',
    periodLabel: '06 Apr 25 - 05 Apr 26',
    submissionDue: '26 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '6',
    clientName: 'Plumber (sole trader)',
    user: 'Tiffany Glass',
    email: 'tiffany@plumbersoletrader.co.uk',
    accountManager: 'Ben Morley',
    submissionType: 'Final Declaration',
    periodLabel: '06 Apr 25 - 05 Apr 26',
    submissionDue: '29 Sep 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
  {
    id: '7',
    clientName: 'Electrician (sole trader)',
    user: 'Ben Morley',
    email: 'ben@electriciansoletrader.co.uk',
    accountManager: 'Ben Morley',
    submissionType: 'Q3',
    periodLabel: '06 Oct 26 - 05 Jan 27',
    submissionDue: '02 Oct 26',
    clientApproval: 'Not required',
    dueStatus: 'Expected in the next 2 weeks',
  },
];
