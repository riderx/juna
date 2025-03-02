import { AxiosInstance } from "axios";
import { GondiLoan } from "../support/types";

interface LoanEdge {
  node: GondiLoan;
}

interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

interface SourceData {
  totalCount: number;
  pageInfo: PageInfo;
  edges: LoanEdge[];
}

export default class Loans {
  private http: AxiosInstance;

  constructor(http: AxiosInstance) {
    this.http = http;
  }

  public async getSources(address: `0x${string}`, after: string | null): Promise<SourceData> {
    const payload = {
      operationName: "ListSources",
      variables: {
        lenderAddress: address,
        statuses: [
          "LOAN_INITIATED",
          "LOAN_DEFAULTED",
          "LOAN_SENT_TO_AUCTION",
          "LOAN_AUCTIONED",
          "LOAN_FORECLOSED",
          "LOAN_REPAID",
        ],
        sortBy: { field: "PRINCIPAL_AMOUNT", order: "DESC" },
        includeLost: true,
        first: 20,
        terms: {},
        currencyAddress: null,
        after: after === "" ? undefined : after,
      },
      query:
        'query ListSources($lenderAddress: String = "", $statuses: [LoanStatusType!] = [], $sortBy: [SourceSortInput!] = [], $terms: TermsFilter, $includeLost: Boolean = false, $currencyAddress: Address, $first: Int = 24, $after: String) {\n  sources: listSources(\n    statuses: $statuses\n    lenderAddress: $lenderAddress\n    sortBy: $sortBy\n    terms: $terms\n    includeLost: $includeLost\n    currencyAddress: $currencyAddress\n    first: $first\n    after: $after\n  ) {\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n      __typename\n    }\n    edges {\n      node {\n        ... on LostSource {\n          id\n          originationFee\n          principalAmount\n          lenderAddress\n          accruedInterest\n          aprBps\n          startTime\n          duration\n          loan {\n            principalAmount\n            principalAddress\n            status\n            currency {\n              symbol\n              decimals\n              address\n              __typename\n            }\n            nft {\n              ...MinimalNft\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        ... on Source {\n          id\n          loanId\n          originationFee\n          principalAmount\n          lenderAddress\n          accruedInterest\n          aprBps\n          startTime\n          loan {\n            status\n            startTime\n            duration\n            principalAmount\n            principalAddress\n            address\n            borrowerAddress\n            loanId\n            id\n            timestamp\n            txHash\n            indexInBlock\n            auction {\n              id\n              endTime\n              status\n              originator\n              triggerFee\n              settler\n              duration\n              startTime\n              highestBid {\n                amount\n                bidder\n                timestamp\n                __typename\n              }\n              __typename\n            }\n            sources {\n              accruedInterest\n              aprBps\n              id\n              lenderAddress\n              loanId\n              originationFee\n              principalAmount\n              startTime\n              __typename\n            }\n            currency {\n              symbol\n              decimals\n              address\n              __typename\n            }\n            repaidActivity {\n              totalInterest\n              timestamp\n              __typename\n            }\n            nft {\n              ...MinimalNft\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment MinimalNft on NFT {\n  id\n  name\n  tokenId\n  nftId\n  owner\n  image {\n    data\n    cacheUrl\n    contentTypeMime\n    accessTypeName\n    __typename\n  }\n  collection {\n    id\n    slug\n    name\n    nftsCount\n    contractData {\n      contractAddress\n      __typename\n    }\n    __typename\n  }\n  __typename\n}',
    };
    return (await this.http.post("graphql?operation=ListSources", payload)).data.data.sources;
  }

  public async get(address: `0x${string}`): Promise<GondiLoan[]> {
    let after: string | null = "";
    let hasNextPage: boolean = false;
    let loans: LoanEdge[] = [];
    do {
      const sources = await this.getSources(address, after);
      loans = loans.concat(sources.edges);
      after = sources.pageInfo.endCursor;
      hasNextPage = sources.pageInfo.hasNextPage;
    } while (hasNextPage);

    return loans.map((edge) => edge.node);
  }
}
