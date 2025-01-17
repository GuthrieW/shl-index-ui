import { GetStaticProps, GetStaticPaths } from 'next';
import { NextSeo } from 'next-seo';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Leaderboard from '../../components/Leaderboard';
import LeadersFilterSelector, {
  LeadersFilter,
} from '../../components/Selector/LeadersFilterSelector';
import SeasonTypeSelector from '../../components/Selector/SeasonTypeSelector';
import { SeasonType } from '../api/v1/schedule';

const skaterLeaderboards = [
  'goals',
  'assists',
  'points',
  'plusminus',
  'shots',
  'shotpct',
  'hits',
  'fightswon',
  'penaltyminutes',
  'shotsblocked',
  'ppg',
  'shg',
];

const goalieLeaderboards = [
  'wins',
  'losses',
  'otl',
  'ga',
  'gaa',
  'gsaa',
  'saves',
  'savepct',
  'shutouts',
  'gamesplayed',
];

interface Props {
  league: string;
}

function Stats({ league }: Props): JSX.Element {
  const [filter, setFilter] = useState<LeadersFilter>('Skaters');
  const [seasonType, setSeasonType] = useState<SeasonType>('Regular Season');
  const [isLoadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [sprites, setSprites] = useState<{
    [index: string]: React.ComponentClass<any>;
  }>({});

  useEffect(() => {
    // Dynamically import svg icons based on the league chosen
    (async () => {
      const { default: s } = await import(
        `../../public/team_logos/${league.toUpperCase()}/`
      );

      setSprites(() => s);
      setLoadingAssets(() => false);
    })();
  }, []);

  const onSeasonTypeSelect = useCallback(
    (type) => setSeasonType(type),
    [setSeasonType]
  );
  const onLeadersFilterSelect = useCallback(
    (filter) => setFilter(filter),
    [setFilter]
  );

  if (isLoadingAssets || !sprites) return null;

  const renderLeaderboards = () => {
    const leaderboards =
      filter === 'Goalies' ? goalieLeaderboards : skaterLeaderboards;
    const playerType = filter === 'Goalies' ? 'goalie' : 'skater';
    const skaterPosition =
      filter === 'Forwards' ? 'f' : filter === 'Defensemen' ? 'd' : '';

    return leaderboards.map((statId) => (
      <Leaderboard
        key={statId}
        league={league}
        playerType={playerType}
        stat={statId}
        seasonType={seasonType}
        Sprites={sprites}
        position={skaterPosition}
      />
    ));
  };

  return (
    <React.Fragment>
      <NextSeo
        title="Leaders"
        openGraph={{
          title: 'Leaders',
        }}
      />
      <Header league={league} activePage="leaders" />
      <Container>
        <Filters>
          <SelectorWrapper>
            <SeasonTypeSelector onChange={onSeasonTypeSelect} />
            <SmallScreenFilters>
              <LeadersFilterSelector
                activeFilter={filter}
                onChange={onLeadersFilterSelect}
              />
            </SmallScreenFilters>
          </SelectorWrapper>
          <DisplaySelectContainer role="tablist">
            <DisplaySelectItem
              onClick={() => setFilter('Skaters')}
              active={filter === 'Skaters'}
              tabIndex={0}
              role="tab"
              aria-selected={filter === 'Skaters'}
            >
              Skaters
            </DisplaySelectItem>
            <DisplaySelectItem
              onClick={() => setFilter('Forwards')}
              active={filter === 'Forwards'}
              tabIndex={0}
              role="tab"
              aria-selected={filter === 'Forwards'}
            >
              Forwards
            </DisplaySelectItem>
            <DisplaySelectItem
              onClick={() => setFilter('Defensemen')}
              active={filter === 'Defensemen'}
              tabIndex={0}
              role="tab"
              aria-selected={filter === 'Defensemen'}
            >
              Defensemen
            </DisplaySelectItem>
            <DisplaySelectItem
              onClick={() => setFilter('Goalies')}
              active={filter === 'Goalies'}
              tabIndex={0}
              role="tab"
              aria-selected={filter === 'Goalies'}
            >
              Goalies
            </DisplaySelectItem>
          </DisplaySelectContainer>
        </Filters>
        <LeaderBoards>{renderLeaderboards()}</LeaderBoards>
      </Container>
      <Footer />
    </React.Fragment>
  );
}

const Container = styled.div`
  height: 100%;
  width: 75%;
  padding: 1px 0 40px 0;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.grey100};

  @media screen and (max-width: 1050px) {
    width: 100%;
    padding: 2.5%;
  }
`;

const Filters = styled.div`
  @media screen and (max-width: 1050px) {
    display: flex;
    flex-direction: column;
    align-items: center;

    button {
      margin-right: 0;
      margin-bottom: 5px;
    }
  }
`;

const SelectorWrapper = styled.div`
  width: 250px;
  float: right;
  margin-right: 3%;
`;

const DisplaySelectContainer = styled.div`
  margin: 28px auto;
  width: 95%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey500};

  @media screen and (max-width: 1050px) {
    display: none;
  }
`;

const DisplaySelectItem = styled.div<{ active: boolean }>`
  display: inline-block;
  padding: 8px 24px;
  border: 1px solid
    ${({ theme, active }) => (active ? theme.colors.grey500 : 'transparent')};
  background-color: ${({ theme, active }) =>
    active ? theme.colors.grey100 : 'transparent'};
  border-radius: 5px 5px 0 0;
  cursor: pointer;
  position: relative;
  border-bottom: none;
  bottom: -1px;
`;

const SmallScreenFilters = styled.div`
  display: none;

  @media screen and (max-width: 1050px) {
    display: block;
  }
`;

const LeaderBoards = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  margin: auto;
  width: 95%;

  @media screen and (max-width: 600px) {
    width: 100%;
  }
`;

export const getStaticPaths: GetStaticPaths = async () => {
  const leagues = ['shl', 'smjhl', 'iihf', 'wjc'];

  const paths = leagues.map((league) => ({
    params: { league },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  return { props: { league: ctx.params.league } };
};

export default Stats;
