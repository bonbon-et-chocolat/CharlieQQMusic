import React from 'react'
import { genericRequest } from '../util.js';

export default class DataTable extends React.Component {
    
    onRowClick() {
        //todo
    }
    onSort(event) {
        //todo
    }
    async fetchData() {
        try{
            const data = await genericRequest(this.props.url);
            this.setState({
                data: data.data.details
            });
        } catch(e) {
            this.setState({
                noDataText: "请求失败"
            })
        } finally{
            this.setState({
                isLoading: false
            })
        }
    }
    constructor( props ) {
        super(props);
        this.state = {
            data: [],
            isLoading: true,
            noDataText: "加载中..."
        };
        this.onRowClick = this.onRowClick.bind(this);
        this.onSort = this.onSort.bind(this);
    }

    componentDidMount() {
        this.fetchData();
    }
}