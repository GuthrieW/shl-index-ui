import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import Cors from 'cors';
import { query } from '../../../../../lib/db';
import use from '../../../../../lib/middleware';
import { Game, convertGameRowToGame, GameRow } from '..';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});


interface TeamRecordRow {
  Wins: number
  Losses: number;
  OTL: number;
  SOL: number;
}

interface TeamStats {
  gamesPlayed: number;
  goalsAgainst: number;
  goalsFor: number;
  record: string;
}

interface TeamIdentity {
  id: number,
  name: string;
  nickname: string;
  abbr: string;
}

export interface Matchup {
  game: Game;
  teams: {
    away: TeamIdentity;
    home: TeamIdentity;
  };
  teamStats: {
    away: TeamStats;
    home: TeamStats;
  };
  previousMatchups: Game[];
}

const parseGamesPlayed = (record: TeamRecordRow) => record ? record.Wins + record.Losses + record.OTL + record.SOL : 0;
const parseTeamRecord = (record: TeamRecordRow) => record ? `${record.Wins}-${record.Losses}-${record.OTL + record.SOL}` : '0-0-0';


export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  await use(req, res, cors);

  const { gameId } = req.query;

  const gameSearch = SQL`
  SELECT DISTINCT s.Slug, s.SeasonID, s.LeagueID, s.Type, s.Date, s.Home, t1.Name as 'HomeName', t1.Nickname as 'HomeNickname', t1.abbr AS 'HomeAbbr', tr1.Wins as 'HomeWins', tr1.Losses as 'HomeLosses', tr1.OTL as 'HomeOTL', tr1.SOW as 'HomeSOW', tr1.SOL as 'HomeSOL', tr1.GF as 'HomeGF', tr1.GA as 'HomeGA', s.HomeScore, s.Away, t2.Name as 'AwayName', t2.Nickname as 'AwayNickname', t2.abbr AS 'AwayAbbr',  tr2.Wins as 'AwayWins', tr2.Losses as 'AwayLosses', tr2.OTL as 'AwayOTL', tr2.SOW as 'AwaySOW', tr2.SOL as 'AwaySOL', tr2.GF as 'AwayGF', tr2.GA as 'AwayGA', s.AwayScore, s.Overtime, s.Shootout, s.Played
    FROM slugviewer AS s
    INNER JOIN team_data as t1
      ON t1.TeamID = s.Home 
      AND t1.LeagueID = s.LeagueID 
      AND t1.SeasonID = s.SeasonID
    INNER JOIN team_data AS t2 
      ON t2.TeamID = s.Away 
        AND t2.LeagueID = s.LeagueID 
        AND t2.SeasonID = s.SeasonID
    INNER JOIN team_records AS tr1
      ON tr1.TeamID = s.Home
      AND tr1.LeagueID = s.LeagueID 
      AND tr1.SeasonID = s.SeasonID
    INNER JOIN team_records AS tr2
      ON tr2.TeamID = s.Away 
        AND tr2.LeagueID = s.LeagueID 
        AND tr2.SeasonID = s.SeasonID
    INNER JOIN slugviewer
    WHERE s.Slug=${gameId}
  `;

  const [game] = await query(gameSearch);

  const { SeasonID, LeagueID, Away, Home, Date, Type } = game;

  const previousMatchupsSearch = SQL`
    SELECT *
    FROM slugviewer
    WHERE SeasonID=${SeasonID}
      AND LeagueID=${LeagueID}
      AND (Home=${Away} OR Away=${Away})
      AND (Home=${Home} OR Away=${Home})
      AND CAST(Date as DATE) < ${Date}
      AND Type=${Type}
    ORDER BY CAST(Date as DATE) DESC;
  `;

  const previousMatchups: Array<GameRow> = await query(previousMatchupsSearch);

  const awayStats: TeamStats = {
    gamesPlayed: parseGamesPlayed({ 
      Wins: game.AwayWins, 
      Losses: game.AwayLosses,
      OTL: game.AwayOTL,
      SOL: game.AwaySOL,
    }),
    goalsFor: game.AwayGF,
    goalsAgainst: game.AwayGA,
    record: parseTeamRecord({ 
      Wins: game.AwayWins, 
      Losses: game.AwayLosses,
      OTL: game.AwayOTL,
      SOL: game.AwaySOL,
    }),
  };

  const homeStats: TeamStats = {
    gamesPlayed: parseGamesPlayed({ 
      Wins: game.HomeWins, 
      Losses: game.HomeLosses,
      OTL: game.HomeOTL,
      SOL: game.HomeSOL,
    }),
    goalsFor: game.HomeGF,
    goalsAgainst: game.HomeGA,
    record: parseTeamRecord({ 
      Wins: game.HomeWins, 
      Losses: game.HomeLosses,
      OTL: game.HomeOTL,
      SOL: game.HomeSOL,
    }),
  }

  const parsedPrevMatchups = previousMatchups.map((game) => convertGameRowToGame(game));
 
  const response: Matchup = {
    game: {
      season: game.SeasonID,
      league: game.LeagueID,
      date: game.Date,
      homeTeam: game.Home,
      homeScore: game.HomeScore,
      awayTeam: game.Away,
      awayScore: game.AwayScore,
      type: game.Type,
      played: game.Played,
      overtime: game.Overtime,
      shootout: game.Shootout,
      slug: game.Slug
    },
    teams: {
      away: {
        id: game.Away,
        name: game.AwayName,
        nickname: game.AwayNickname,
        abbr: game.AwayAbbr,
      },
      home: {
        id: game.Home,
        name: game.HomeName,
        nickname: game.HomeNickname,
        abbr: game.HomwAbbr,
      },
    },
    teamStats: {
      away: awayStats,
      home: homeStats
    },
    previousMatchups: parsedPrevMatchups
  };

  res.status(200).json(response);
};
