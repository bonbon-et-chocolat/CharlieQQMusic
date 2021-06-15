import React from 'react'
import DataTable from './DataTable';
const columns = [
    {
        Header: '歌曲',
        accessor: 'title',
        headerTooltip: '歌曲'
    },
    {
        Header: '收藏',
        accessor: 'favCount',
        disableFilters: false,
        disableGroupBy: true,
        disableSortBy: false,
        hAlign: 'End'
    },
    {
        Header: '今日增长',
        accessor: 'increase',
        disableGroupBy: true,
        hAlign: 'End'
    },
    {
        Header: '昨日增长',
        accessor: 'yesterdayInc',
        disableGroupBy: true,
        hAlign: 'End'
    }
]
const url = "/songs?format=json";
export default class Songs extends React.Component{
    render() {
        return (
            <DataTable
                columns={columns}
                url={url}>
            </DataTable>
        )
    }
}