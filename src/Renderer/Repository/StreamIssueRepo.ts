import {DBIPC} from '../../IPC/DBIPC';
import {StreamRepo} from './StreamRepo';
import {GitHubQueryParser} from '../Infra/GitHubQueryParser';
import {IssueEntity} from '../Type/IssueEntity';
import {StreamIssueEntity} from '../Type/StreamIssueEntity';

class _StreamIssueRepo {
  // todo: IssueRepoに移動する
  async createBulk(streamId: number, issues: IssueEntity[]): Promise<{error?: Error}> {
    if (!issues.length) return {};

    // get StreamIssue
    const {error: e1, rows} = await DBIPC.select<StreamIssueEntity>(`select * from streams_issues where stream_id = ?`, [streamId]);
    if (e1) return {error: e1};

    // filter notExistIssues
    const existIssueIds = rows.map(row => row.issue_id);
    const notExistIssues = issues.filter(issue => !existIssueIds.includes(issue.id));

    // insert bulk issues
    if (notExistIssues.length) {
      const bulkParams = notExistIssues.map(issue => `(${streamId}, ${issue.id})`);
      const {error: e2} = await DBIPC.exec(`insert into streams_issues (stream_id, issue_id) values ${bulkParams.join(',')}`);
      if (e2) return {error: e2};
    }

    // unlink mismatch issues
    const {error: e3} = await this.unlinkMismatchIssues(issues);
    if (e3) return {error: e3};

    // delete unlinked issues
    const {error: e4} = await DBIPC.exec(`delete from streams_issues where issue_id not in (select id from issues)`);
    if (e4) return {error: e4};

    return {};
  }

  // async import(streamId: number, issues: any[]) {
  //   for (const issue of issues) {
  //     const params = [streamId, issue.id];
  //     const res = await DBIPC.selectSingle(`select * from streams_issues where stream_id = ? and issue_id = ?`, params);
  //     if (!res.row) {
  //       await DBIPC.exec('insert into streams_issues (stream_id, issue_id) values (?, ?)', params);
  //     }
  //   }
  //
  //   await this.unlinkMismatchIssues(issues);
  //
  //   // see IssuesTable
  //   await DBIPC.exec(`
  //     delete from
  //       streams_issues
  //     where
  //       issue_id not in (select id from issues)
  //   `);
  // }

  private async unlinkMismatchIssues(issues: IssueEntity[]): Promise<{error?: Error}> {
    const res = await StreamRepo.getAllStreams();
    if (res.error) return {error: res.error};

    const issueIds = issues.map(issue => issue.id).join(',');
    for (const stream of res.streams) {
      const {error, rows} = await DBIPC.select<StreamIssueEntity>(`select * from streams_issues where stream_id = ? and issue_id in (${issueIds})`, [stream.id]);
      if (error) return {error};
      if (!rows.length) continue;

      // filter target issues
      const targetIssueIds = rows.map(row => row.issue_id);
      const targetIssues = issues.filter(issue => targetIssueIds.includes(issue.id));
      const queries = JSON.parse(stream.queries);

      // queryごとにmismatchのissueを取り出す
      const mismatchIssues: IssueEntity[] = [];
      for (const query of queries) {
        mismatchIssues.push(...GitHubQueryParser.takeMismatchIssues(query, targetIssues));
      }

      // すべてのqueryにmismatchのissueを取り出す
      const realMismatchIssues: IssueEntity[] = [];
      for (const issue of mismatchIssues) {
        const count = mismatchIssues.filter(v => v.id === issue.id).length;
        if (count === queries.length) realMismatchIssues.push(issue);
      }

      // unlink mismatch issues
      if (realMismatchIssues.length) {
        console.log(`[unlink]: stream: "${stream.name}", queries: "${queries.join(', ')}", [${realMismatchIssues.map(v => v.title)}]`);
        const mismatchIssueIds = realMismatchIssues.map(issue => issue.id).join(',');
        const {error} = await DBIPC.exec(`delete from streams_issues where stream_id = ? and issue_id in (${mismatchIssueIds})`, [stream.id]);
        if (error) return {error};
      }
    }

    return {}
  }

  async totalCount(streamId: number): Promise<{error?: Error; count?: number}> {
    const result = await DBIPC.selectSingle(`
        select
          count(1) as count
        from
          streams_issues
        where
          stream_id = ?
      `, [streamId]);
    return {count: result.row.count};
  }
}

export const StreamIssueRepo = new _StreamIssueRepo();
