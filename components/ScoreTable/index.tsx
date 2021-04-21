import React, { useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import styled from 'styled-components';
// import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
// import Link from '../../components/LinkWithSeason';
import { Player, Goalie } from '../..';

interface Columns {
  Header: string;
  id?: string;
  title?: string;
  accessor: string | ((stats: Player) => string);
}

interface ColumnData {
  Header: string;
  id?: string;
  columns: Array<Columns>;
}

interface Props {
  data: Array<Player | Goalie>;
  columnData: Array<ColumnData>;
  pagination?: boolean;
  teamPage?: boolean;
  // isLoading: boolean;
}

function ScoreTable({
  data: players,
  pagination = false,
  columnData,
  teamPage = false,
}: // isLoading
Props): JSX.Element {
  // ! add loading state
  const data = useMemo(() => players, [players]);

  // ! add loading state
  const columns = useMemo(() => {
      // handle logic with teamPage
      if(teamPage) {
        // loop through columns to find the team column and remove it from the columnData
        let i = columnData[0]["columns"].length
        while(i--) {
          if (columnData[0]["columns"][i].Header == "Team") {
            delete columnData[0]["columns"][i]
          }
        }
      }
      return columnData
    }, []);



  const initialState = useMemo(() => {
    if (players[0] && 'wins' in players[0]) {
      return { sortBy: [{ id: 'wins', desc: true }] };
    }
    return { sortBy: [{ id: 'points', desc: true }] };
  }, []);

  let table;
  if (pagination) {
    table = useTable(
      {
        columns,
        data,
        initialState: { pageIndex: 0, pageSize: 15, ...initialState },
      },
      useSortBy,
      usePagination
    );
  } else {
    table = useTable({ columns, data, initialState }, useSortBy);
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    page,
    prepareRow,

    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    nextPage,
    previousPage,
    gotoPage,
    state: { pageIndex },
  } = table;

  const hasData = rows.length > 0;

  return (
    <>
      {!hasData && <Notice>No results found</Notice>}
      {hasData && (
        <TableContainer>
          <Table {...getTableProps()}>
            <TableHeader>
              {headerGroups.map((headerGroup, i) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={i}>
                  {headerGroup.headers.map((column, i) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      title={column.title}
                      key={`${i}_${column.id}`}
                      className={
                        column.isSorted
                          ? column.isSortedDesc
                            ? 'sorted--desc'
                            : 'sorted--asc'
                          : ''
                      }
                    >
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </TableHeader>
            <TableBody {...getTableBodyProps()}>
              {hasData && pagination
                ? page.map((row, i) => {
                    prepareRow(row);

                    return (
                      <tr {...row.getRowProps()} key={i}>
                        {row.cells.map((cell, i) => {
                          return (
                            <td
                              {...cell.getCellProps()}
                              key={i}
                              className={cell.column.isSorted ? 'sorted' : ''}
                            >
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                : rows.map((row, i) => {
                    prepareRow(row);

                    return (
                      <tr {...row.getRowProps()} key={i}>
                        {row.cells.map((cell, i) => {
                          return (
                            <td
                              {...cell.getCellProps()}
                              key={i}
                              className={cell.column.isSorted ? 'sorted' : ''}
                            >
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {hasData && pagination && (
        <Pagination>
          <button
            className="-next"
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
          >
            {'<<'}
          </button>{' '}
          <button
            className="-next"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          >
            {'<'}
          </button>
          <div className="pagenav">
            <span>
              Page{' '}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>{' '}
            </span>
            <span className="mediahide">
              | Go to page:{' '}
              <input
                type="number"
                defaultValue={pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(page);
                }}
                style={{ width: '40px' }}
              />
            </span>
          </div>
          <button
            className="-next"
            onClick={() => nextPage()}
            disabled={!canNextPage}
          >
            {'>'}
          </button>{' '}
          <button
            className="-next"
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
          >
            {'>>'}
          </button>{' '}
        </Pagination>
      )}
    </>
  );
}

const TableContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey500};
  border-top: none;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 10px;

  tr:not(:last-child) th,
  tr:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.grey500};
  }
`;

const Table = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;

  border-radius: inherit;
`;

const TableHeader = styled.thead`
  background-color: ${({ theme }) => theme.colors.grey900};
  color: ${({ theme }) => theme.colors.grey100};
  position: relative;

  tr {
    display: table-row;
  }

  th {
    height: 50px;
    font-weight: 400;
    background-color: ${({ theme }) => theme.colors.grey900};
    position: relative;

    &.sorted--asc::before {
      content: '^';
      position: absolute;
      top: 3px;
      left: calc(100% / 2 - 4px);
    }

    &.sorted--desc::after {
      content: 'v';
      font-size: 14px;
      position: absolute;
      bottom: 3px;
      left: calc(100% / 2 - 4px);
    }
  }

  th:not(:first-child) {
    cursor: help;
    text-align: center;
  }
`;

const TableBody = styled.tbody`
  background-color: ${({ theme }) => theme.colors.grey100};
  margin: 0 auto;
  display: table-row-group;
  vertical-align: middle;
  position: relative;

  th {
    display: table-cell;
    text-align: left;
    font-weight: 400;
    background-color: ${({ theme }) => theme.colors.grey200};
    position: sticky;
    left: 0px;
  }

  td {
    font-family: Montserrat, Arial, Helvetica, sans-serif;
    padding: 10px;
    text-align: center;

    &.sorted {
      background-color: rgba(1, 131, 218, 0.1);
    }
  }

  tr {
    &:hover {
      background-color: rgba(1, 131, 218, 0.1);
    }
  }
`;

const Notice = styled.div`
  width: 100%;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  padding: 5px;
`;

const Pagination = styled.div`
  z-index: 1;
  display: flex;
  justify-content: space-between;
  flex: 1.5;
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;
  box-sizing: border-box;
  border-radius: 0 0 10px 10px;
  border: 1px solid #adb5bd;
  border-top: none;
  font-family: Montserrat, sans-serif;

  button {
    text-rendering: auto;
    display: block;
    color: #fff;
    letter-spacing: normal;
    word-spacing: normal;
    text-transform: none;
    text-indent: 0px;
    text-shadow: none;
    text-align: center;
    align-items: flex-start;
    box-sizing: border-box;
    margin: 0.2rem 0.4rem;
    font-size: 24px;
    padding: 1px 8px;
    background-color: #0183da;
    width: 50%;
    height: 100%;
    border-width: 1.5px;
    border-style: outset;
    border-image: initial;
    border-radius: 5px;
    cursor: pointer;
  }

  button:disabled,
  button[disabled] {
    border: 1px solid #999999;
    background-color: #cccccc;
    color: #666666;
  }

  .pagenav {
    width: 100%;
    margin-left: 3px;
    align-items: center;
    text-align: center;
  }

  .mediahide {
    @media screen and (max-width: 1024px) {
      display: none;
    }
  }
`;

export default ScoreTable;
