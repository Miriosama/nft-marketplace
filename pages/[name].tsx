import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import BetaBanner from 'components/base/BetaBanner';
import MainHeader from 'components/base/MainHeader';
import TernoaWallet from 'components/base/TernoaWallet';
import PublicProfile from 'components/pages/PublicProfile';
import cookies from 'next-cookies';

import { getUser, getProfile } from 'actions/user';
import { getCreatorNFTS } from 'actions/nft';
import { NftType, UserType } from 'interfaces';
import { NextPageContext } from 'next';
import { decryptCookie } from 'utils/cookie';
import { getUserIp } from 'utils/functions';
import { middleEllipsis } from 'utils/strings';

export interface PublicProfileProps {
  user: UserType;
  profileWalletId: string;
  profile: UserType;
  data: NftType[];
  dataHasNextPage: boolean;
}

const PublicProfilePage = ({
  user,
  profileWalletId,
  data,
  profile,
  dataHasNextPage,
}: PublicProfileProps) => {
  const [modalExpand, setModalExpand] = useState(false);
  const [walletUser, setWalletUser] = useState(user);
  const [viewProfile, setViewProfile] = useState(profile);
  const [dataNfts, setDataNfts] = useState(data);
  const [dataNftsHasNextPage, setDataNftsHasNextPage] = useState(dataHasNextPage);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadMoreNfts = async () => {
    setIsLoading(true);
    try {
      if (dataNftsHasNextPage) {
        let result = await getCreatorNFTS(
          profileWalletId,
          (currentPage + 1).toString(),
          undefined,
          true
        );
        setCurrentPage(currentPage + 1);
        setDataNftsHasNextPage(result.hasNextPage || false);
        setDataNfts([...dataNfts, ...result.data]);
        setIsLoading(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setViewProfile(profile)
  }, [profile])
  useEffect(() => {
    setDataNfts(data)
  }, [data])
  useEffect(() => {
    setDataNftsHasNextPage(dataHasNextPage)
  }, [dataHasNextPage])

  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME ? process.env.NEXT_PUBLIC_APP_NAME : "SecretNFT"} - {viewProfile?.name || middleEllipsis(profileWalletId, 10)}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="description"
          content={`Ternoart - ${viewProfile?.name || middleEllipsis(profileWalletId, 10)} profile page.`}
        />
        <meta name="og:image" content="ternoa-social-banner.jpg" />
      </Head>
      {modalExpand && <TernoaWallet setModalExpand={setModalExpand} />}
      <BetaBanner />
      <MainHeader user={walletUser} setModalExpand={setModalExpand} />
      <PublicProfile
        user={walletUser}
        setUser={setWalletUser}
        profile={viewProfile}
        setProfile={setViewProfile}
        profileWalletId={profileWalletId}
        NFTS={dataNfts}
        setModalExpand={setModalExpand}
        loadMore={loadMoreNfts}
        hasNextPage={dataNftsHasNextPage}
        loading={isLoading}
      />
    </>
  );
};
export async function getServerSideProps(ctx: NextPageContext) {
  const token = cookies(ctx).token && decryptCookie(cookies(ctx).token as string);
  let user: UserType | null = null,
    profile: UserType | null = null,
    data: NftType[] = [],
    dataHasNextPage: boolean = false;
  const promises = [];
  let ip = getUserIp(ctx.req)
  const profileWalletId = ctx.query.name
  if (token) {
    promises.push(
      new Promise<void>((success) => {
        getUser(token, undefined, true)
          .then((_user) => {
            user = _user;
            success();
          })
          .catch(success);
      })
    );
  }
  promises.push(new Promise<void>((success) => {
    getProfile(ctx.query.name as string, token ? token : null, ip).then(_profile => {
      profile = _profile
      success();
    }).catch(success);
  }));
  promises.push(new Promise<void>((success) => {
    getCreatorNFTS(ctx.query.name as string, undefined, undefined, true).then(result => {
      data = result.data
      dataHasNextPage = result.hasNextPage || false;
      success();
    }).catch(success);
  }));
  await Promise.all(promises)
  if (!profile || !data) {
    return {
      notFound: true,
    };
  }
  return {
    props: { user, profileWalletId, profile, data, dataHasNextPage },
  };
}

export default PublicProfilePage;
